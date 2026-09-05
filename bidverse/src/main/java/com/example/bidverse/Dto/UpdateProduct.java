package com.example.bidverse.Dto;
import java.math.BigDecimal;
public record UpdateProduct(
        String name,
        String description,
        BigDecimal basePrice
) {
}