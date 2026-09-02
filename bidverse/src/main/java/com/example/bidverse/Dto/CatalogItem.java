package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record CatalogItem(Long auctionItemId, Long productId, String name, String description, Long categoryId, BigDecimal basePrice, BigDecimal currentPrice, String auctionStatus) {
}
