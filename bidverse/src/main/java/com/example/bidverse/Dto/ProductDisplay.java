package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record ProductDisplay(
        Long productId,
        Long sellerId,
        String sellerName,
        Long categoryId,
        String categoryName,
        String productName,
        String description,
        BigDecimal basePrice,
        String status,
        String imageUrl
) {
}
