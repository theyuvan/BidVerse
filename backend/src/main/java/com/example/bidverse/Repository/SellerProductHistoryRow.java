package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface SellerProductHistoryRow {
    Long getProductId();
    Long getCategoryId();
    String getCategoryName();
    String getName();
    String getDescription();
    BigDecimal getBasePrice();
    String getProductStatus();
    Long getRoomId();
    String getAuctionStatus();
    String getDealStatus();
    Long getBuyerId();
    String getBuyerName();
    String getBuyerEmail();
    String getBuyerPhone();
    String getImageUrl();
}
