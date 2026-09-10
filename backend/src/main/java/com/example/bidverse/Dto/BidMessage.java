package com.example.bidverse.Dto;

import java.math.BigDecimal;





public record BidMessage(
        Long auctionItemId, Long buyerId, String mode, BigDecimal amount, Integer incrementPercent) {
    public BidMessage(Long auctionItemId, Long buyerId, String mode, BigDecimal amount) {
        this(auctionItemId, buyerId, mode, amount, null);
    }
}
