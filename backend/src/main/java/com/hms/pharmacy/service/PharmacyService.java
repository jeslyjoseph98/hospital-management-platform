package com.hms.pharmacy.service;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.doctor.dto.ConsultationResponse.PrescriptionItemResponse;
import com.hms.doctor.mapper.ConsultationMapper;
import com.hms.pharmacy.dto.PrescriptionDetailResponse;
import com.hms.pharmacy.dto.PrescriptionDetailResponse.PatientMini;
import com.hms.pharmacy.dto.PrescriptionListItem;
import com.hms.pharmacy.mapper.PharmacyMapper;
import com.hms.pharmacy.mapper.PharmacyMapper.DetailRow;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PharmacyService {

    private final PharmacyMapper pharmacyMapper;
    private final ConsultationMapper consultationMapper;

    public PharmacyService(PharmacyMapper pharmacyMapper, ConsultationMapper consultationMapper) {
        this.pharmacyMapper = pharmacyMapper;
        this.consultationMapper = consultationMapper;
    }

    /** PHR-R2: default filter is completed today. */
    public List<PrescriptionListItem> pending(LocalDate date) {
        return pharmacyMapper.findPending(date != null ? date : LocalDate.now());
    }

    /** PHR-R3: exact match on patient code / phone / appointment code. */
    public List<PrescriptionListItem> search(String q) {
        return pharmacyMapper.search(q);
    }

    public PrescriptionDetailResponse getDetail(Long consultationId) {
        DetailRow row = pharmacyMapper.findDetail(consultationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PHR_NOT_FOUND, "Prescription not found"));
        return toResponse(row);
    }

    @Transactional
    public PrescriptionDetailResponse dispense(Long consultationId, Long dispensedBy, String remarks) {
        DetailRow row = pharmacyMapper.findDetail(consultationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PHR_NOT_FOUND, "Prescription not found"));
        if ("NOT_REQUIRED".equals(row.dispenseStatus())) { // PHR-R5
            throw new BusinessException(ErrorCode.PHR_NOTHING_TO_DISPENSE, "This consultation has no prescription to dispense");
        }
        if ("DISPENSED".equals(row.dispenseStatus())) { // PHR-R5
            throw new BusinessException(ErrorCode.PHR_ALREADY_DISPENSED, "This prescription was already marked as done");
        }
        int rows = pharmacyMapper.dispense(consultationId, dispensedBy, remarks); // PHR-R6
        if (rows == 0) {
            throw new BusinessException(ErrorCode.PHR_ALREADY_DISPENSED, "This prescription was already marked as done");
        }
        return getDetail(consultationId);
    }

    private PrescriptionDetailResponse toResponse(DetailRow row) {
        List<PrescriptionItemResponse> items = consultationMapper.findItems(row.consultationId()).stream()
                .map(i -> new PrescriptionItemResponse(i.getMedicineName(), i.getStrength(), i.getDosagePattern(),
                        i.getTiming(), i.getDurationDays(), i.getInstructions()))
                .toList();
        PatientMini patient = new PatientMini(row.patientName(), row.patientCode(), row.age(), row.gender());
        return new PrescriptionDetailResponse(row.consultationId(), patient, row.doctorName(), row.consultationDate(),
                row.diagnosis(), items, row.followUpDate(), row.dispenseStatus(), row.dispensedAt(),
                row.dispensedByName(), row.dispenseRemarks());
    }
}
