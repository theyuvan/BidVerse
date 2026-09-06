package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface LiveAuctionItemRow {
    Long getAuctionItemId();
    Long getProductId();
    String getProductName();
    String getCategoryName();
    String getSellerName();
    BigDecimal getBasePrice();
    BigDecimal getCurrentPrice();
    String getAuctionStatus();
}
