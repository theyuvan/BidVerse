package com.example.bidverse.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "deals")
public class Deal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deal_id")
    private Long dealId;
    @Column(name = "aucion_item_id", nullable = false)
    private Long auctionItemId;
    @Column(name = "seller_id", nullable = false)
    private Long sellerId;
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    @Column(name = "final_amount", nullable = false)
    private Double finalPrice;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "cancel_reason", nullable = false)
    private String cancelReason;
    
}
