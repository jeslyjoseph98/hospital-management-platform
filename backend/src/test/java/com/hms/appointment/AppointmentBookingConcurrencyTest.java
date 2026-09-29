package com.hms.appointment;

import static org.assertj.core.api.Assertions.assertThat;

import com.hms.appointment.dto.BookRequest;
import com.hms.appointment.service.AppointmentService;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Verifies the doctor-row lock in AppointmentService.book (spec_details/03 §3 step 2): two patients
 * racing for the last available slot must not both succeed.
 */
@Testcontainers
@SpringBootTest
class AppointmentBookingConcurrencyTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("hms").withUsername("hms").withPassword("hms");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void onlyOnePatientWinsTheLastSlot() throws Exception {
        // Doctor 1 (Dr. Rahul Menon) is seeded with Monday availability; force daily_limit to 1
        // so the second concurrent booking attempt has no slot left.
        jdbcTemplate.update("UPDATE doctors SET daily_limit = 1 WHERE id = 1");

        Long patientA = insertPatient("9845011111");
        Long patientB = insertPatient("9845022222");

        // nextOrSame(MONDAY) is at most 6 days out, so it always falls inside the booking window.
        LocalDate bookingDate = LocalDate.now().with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.MONDAY));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Future<Object> resultA = pool.submit(() -> bookAndCapture(patientA, bookingDate, ready, go));
        Future<Object> resultB = pool.submit(() -> bookAndCapture(patientB, bookingDate, ready, go));

        ready.await();
        go.countDown();

        Object outcomeA = resultA.get();
        Object outcomeB = resultB.get();
        pool.shutdown();

        List<Object> outcomes = List.of(outcomeA, outcomeB);
        long successes = outcomes.stream().filter(o -> o instanceof Long).count();
        long fullyBooked = outcomes.stream()
                .filter(o -> o instanceof BusinessException be && be.getErrorCode() == ErrorCode.APT_DOCTOR_FULLY_BOOKED)
                .count();

        assertThat(successes).isEqualTo(1);
        assertThat(fullyBooked).isEqualTo(1);

        Integer bookedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM appointments WHERE doctor_id = 1 AND appointment_date = ? AND status = 'BOOKED'",
                Integer.class, bookingDate);
        assertThat(bookedCount).isEqualTo(1);
    }

    private Object bookAndCapture(Long patientId, LocalDate date, CountDownLatch ready, CountDownLatch go) {
        try {
            ready.countDown();
            go.await();
            var response = appointmentService.book(patientId, new BookRequest(1L, date, "test visit"));
            return response.appointmentId();
        } catch (BusinessException e) {
            return e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

    private Long insertPatient(String phone) {
        jdbcTemplate.update(
                "INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, password_hash, is_active) "
                        + "VALUES (?, ?, ?, ?, ?, ?, 1)",
                "Test", "Patient", LocalDate.of(1990, 1, 1), "MALE", phone, passwordEncoder.encode("password1"));
        Long id = jdbcTemplate.queryForObject("SELECT id FROM patients WHERE phone = ?", Long.class, phone);
        jdbcTemplate.update("UPDATE patients SET patient_code = ? WHERE id = ?",
                "PAT" + String.format("%06d", id), id);
        return id;
    }
}
