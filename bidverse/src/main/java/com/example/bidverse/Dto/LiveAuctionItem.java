package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record LiveAuctionItem(
        Long auctionItemId,
        Long productId,
        String productName,
        String categoryName,
        String sellerName,
        BigDecimal basePrice,
        BigDecimal currentPrice,
        String auctionStatus
) {
}
