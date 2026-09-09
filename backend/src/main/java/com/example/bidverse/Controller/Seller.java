package com.example.bidverse.Controller;

import com.example.bidverse.Dto.DealDecisionRequest;
import com.example.bidverse.Dto.SellerDealView;
import com.example.bidverse.Entity.Categories;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Dto.SellerProductHistory;
import com.example.bidverse.Security.AuthenticatedUser;
import com.example.bidverse.Security.CurrentUser;
import com.example.bidverse.Service.SellerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seller")
public class Seller {
    private final SellerService sellerService;
    public Seller(SellerService sellerService) {
        this.sellerService = sellerService;
    }
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductDetails(
        @PathVariable Long productId, @CurrentUser AuthenticatedUser seller) {

        Product product = sellerService.getProductDetails(productId, seller.userId());
        return new ResponseEntity<>(product, HttpStatus.OK);
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product, @CurrentUser AuthenticatedUser seller) {
        sellerService.createProduct(seller.userId(), product);
        return new ResponseEntity<>(
                "Product Created Successfully",
                HttpStatus.CREATED
        );
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getSellerProducts(@CurrentUser AuthenticatedUser seller) {
        return ResponseEntity.ok(sellerService.getProducts(seller.userId()));
    }

    @GetMapping("/products/history")
    public ResponseEntity<List<SellerProductHistory>> getProductHistory(@CurrentUser AuthenticatedUser seller) {
        return ResponseEntity.ok(sellerService.getProductHistory(seller.userId()));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Categories>> getCategories() {
        return ResponseEntity.ok(sellerService.getCategories());
    }

    @GetMapping("/deals")
    public ResponseEntity<List<SellerDealView>> getSellerDeals(@CurrentUser AuthenticatedUser seller) {
        return ResponseEntity.ok(sellerService.getDeals(seller.userId()));
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<SellerDealView> getDealDetails(
            @PathVariable Long dealId, @CurrentUser AuthenticatedUser seller) {
        return ResponseEntity.ok(sellerService.getOwnDealDetails(dealId, seller.userId()));
    }

    @PostMapping("/deals/{dealId}/decision")
    public ResponseEntity<SellerDealView> decideDeal(
            @PathVariable Long dealId,
            @CurrentUser AuthenticatedUser seller,
            @RequestBody DealDecisionRequest decision
    ) {
        return ResponseEntity.ok(sellerService.confirmDeal(
                seller.userId(),
                dealId,
                decision.decision(),
                decision.reason()
        ));
    }
}
