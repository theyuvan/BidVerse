package com.example.bidverse.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;
    @Column(name = "seller_id", nullable = false)
    private Long sellerId;
    @Column(name = "Category_id", nullable = false)
    private Long categoryId;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "description")
    private String description;
    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "image_url")
    private String imageUrl;
    
}
