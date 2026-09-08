package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record CatalogItem(
        Integer sequence,
        Long auctionItemId,
        Long productId,
        String productName,
        String description,
        Long categoryId,
        String categoryName,
        BigDecimal basePrice,
        BigDecimal currentPrice,
        String auctionStatus,
        String imageUrl
) {
}
