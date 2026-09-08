package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface CatalogItemRow {

    Long getAuctionItemId();

    Long getProductId();

    String getProductName();

    String getDescription();
    Long getCategoryId();
    String getCategoryName();
    BigDecimal getBasePrice();
    BigDecimal getCurrentPrice();
    String getAuctionStatus();
    String getImageUrl();
}
