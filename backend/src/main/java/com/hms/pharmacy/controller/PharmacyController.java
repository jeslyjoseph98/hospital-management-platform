package com.hms.pharmacy.controller;

import com.hms.common.security.CurrentPharmacist;
import com.hms.common.web.ApiResponse;
import com.hms.pharmacy.dto.DispenseRequest;
import com.hms.pharmacy.dto.PrescriptionDetailResponse;
import com.hms.pharmacy.dto.PrescriptionListItem;
import com.hms.pharmacy.service.PharmacyService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pharmacy/prescriptions")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/pending")
    public ApiResponse<List<PrescriptionListItem>> pending(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(pharmacyService.pending(date));
    }

    @GetMapping("/search")
    public ApiResponse<List<PrescriptionListItem>> search(@RequestParam String q) {
        return ApiResponse.ok(pharmacyService.search(q));
    }

    @GetMapping("/{consultationId}")
    public ApiResponse<PrescriptionDetailResponse> detail(@PathVariable Long consultationId) {
        return ApiResponse.ok(pharmacyService.getDetail(consultationId));
    }

    @PostMapping("/{consultationId}/dispense")
    public ApiResponse<PrescriptionDetailResponse> dispense(@PathVariable Long consultationId,
                                                             @Valid @RequestBody DispenseRequest request) {
        return ApiResponse.ok(
                pharmacyService.dispense(consultationId, CurrentPharmacist.id(), request.remarks()), "Marked as done");
    }
}
