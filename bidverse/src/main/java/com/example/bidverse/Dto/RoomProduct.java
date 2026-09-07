package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record RoomProduct(
        Long auctionItemId,
        Long productId,
        String name,
        String description,
        BigDecimal basePrice,
        String auctionStatus
) {
}
