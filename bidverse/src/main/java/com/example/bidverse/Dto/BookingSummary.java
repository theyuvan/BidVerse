package com.example.bidverse.Dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record BookingSummary(Long roomSeatId,
        Long roomId,
        String roomTitle,
        String roomStatus,
        OffsetDateTime startTime,
        BigDecimal advanceAmount,
        String advanceStatus,
        boolean canJoin,
        OffsetDateTime waitingStartedAt,
        OffsetDateTime joinedAt,
        String attendanceStatus,
        String refundStatus
) {
}
