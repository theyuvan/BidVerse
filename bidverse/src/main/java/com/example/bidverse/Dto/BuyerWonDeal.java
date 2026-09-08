package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record BuyerWonDeal(
        Long dealId,
        Long auctionItemId,
        Long roomId,
        Long productId,
        String productName,
        String productDescription,
        String imageUrl,
        BigDecimal finalPrice,
        String dealStatus,
        String buyerStatus,
        String sellerStatus,
        Long sellerId,
        String sellerName,
        String sellerEmail,
        String sellerPhone
) {
}
