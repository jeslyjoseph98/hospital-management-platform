package com.hms.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReplaceTimingsRequest(@NotNull @Valid List<TimingRequest> timings) {
}
