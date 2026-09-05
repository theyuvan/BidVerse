package com.example.bidverse.Dto;

import java.math.BigDecimal;

/**
 * mode: "AUTO" (quick-bid button, server computes +5% of base price) or "MANUAL" (buyer supplies amount).
 * amount is required for MANUAL, ignored for AUTO.
 */
public record BidMessage(Long auctionItemId, Long buyerId, String mode, BigDecimal amount) {
}
