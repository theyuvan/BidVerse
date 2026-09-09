package com.example.bidverse.Dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateRoomRequest(String title, Integer seatLimit, BigDecimal advanceAmount,
                                OffsetDateTime startTime, List<Long> productIds) {}
