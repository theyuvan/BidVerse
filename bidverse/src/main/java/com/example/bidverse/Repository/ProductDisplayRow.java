package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface ProductDisplayRow {
    Long getProductId();
    Long getSellerId();
    String getSellerName();
    Long getCategoryId();
    String getCategoryName();
    String getProductName();
    String getDescription();
    BigDecimal getBasePrice();
    String getStatus();
    String getImageUrl();
}
