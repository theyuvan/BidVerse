package com.example.bidverse.Controller;


import com.example.bidverse.Dto.SellerDealDecision;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Service.SellerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seller")
public class Seller{

    private final SellerService sellerService;

    public Seller(SellerService sellerService){
        this.sellerService = sellerService;
    }

    @GetMapping("/{sellerId}/deals")
    public ResponseEntity<List<Deal>> displayDeals(@PathVariable Long sellerId) {
        return ResponseEntity.ok(sellerService.getDeals(sellerId));
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<Deal> dealDetails(@PathVariable Long dealId) {
        return ResponseEntity.ok(sellerService.getDetails(dealId));
    }

    @PostMapping("/deals/{dealId}/confirm")
    public ResponseEntity<Deal> confirmDeal(@PathVariable Long dealId, @RequestBody SellerDealDecision request) {
        return ResponseEntity.ok(sellerService.confirmDeal(dealId, request.decision(), request.reason()));
    }
}