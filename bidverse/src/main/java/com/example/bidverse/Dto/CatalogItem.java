package com.example.bidverse.Dto;

public record CatalogItem(
        Long auctionItemId,
        Long productId,
        String productName,
        String description,
        String categoryName,
        String imageUrl
) {
}
