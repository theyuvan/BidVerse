package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record SellerDealView(
        Long dealId,
        Long auctionItemId,
        Long roomId,
        Long productId,
        String productName,
        String productDescription,
        String imageUrl,
        BigDecimal finalPrice,
        String status,
        String cancelReason,
        String buyerStatus,
        String sellerStatus,
        Long sellerId,
        Long buyerId,
        String buyerName,
        String buyerEmail,
        String buyerPhone
) {
}
