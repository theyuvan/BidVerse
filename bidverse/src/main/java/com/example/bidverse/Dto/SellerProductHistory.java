package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record SellerProductHistory(
        Long productId,
        String name,
        String description,
        BigDecimal basePrice,
        String productStatus,
        Long roomId,
        String auctionStatus,
        String dealStatus,
        Long buyerId,
        String buyerName,
        String buyerEmail,
        String buyerPhone
) {
}
