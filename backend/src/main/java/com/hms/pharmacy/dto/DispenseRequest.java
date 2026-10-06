package com.hms.pharmacy.dto;

import jakarta.validation.constraints.Size;

public record DispenseRequest(@Size(max = 500) String remarks) {
}
