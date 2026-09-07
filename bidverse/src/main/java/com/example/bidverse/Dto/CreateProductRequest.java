package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record CreateProductRequest(
        Long sellerId,
        Long categoryId,
        String name,
        String description,
        BigDecimal basePrice,
        String imageUrl
) {
}
