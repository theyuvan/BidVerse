package com.example.bidverse.Controller;

import com.example.bidverse.Dto.CreateProductRequest;
import com.example.bidverse.Dto.DealDecisionRequest;
import com.example.bidverse.Dto.SellerDealView;
import com.example.bidverse.Entity.Categories;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Dto.SellerProductHistory;
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
        @PathVariable Long productId) {

        Product product = sellerService.getProductDetails(productId);

        if (product == null) {
            return new ResponseEntity<>(
                "Product Not Found",
                HttpStatus.NOT_FOUND
            );
        }
        return new ResponseEntity<>(
            product,
            HttpStatus.OK
        );
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        sellerService.createProduct(product);
        return new ResponseEntity<>(
                "Product Created Successfully",
                HttpStatus.CREATED
        );
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getSellerProducts(@RequestParam Long sellerId) {
        return ResponseEntity.ok(sellerService.getProducts(sellerId));
    }

    @GetMapping("/products/history")
    public ResponseEntity<List<SellerProductHistory>> getProductHistory(@RequestParam Long sellerId) {
        return ResponseEntity.ok(sellerService.getProductHistory(sellerId));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Categories>> getCategories() {
        return ResponseEntity.ok(sellerService.getCategories());
    }

    @GetMapping("/deals")
    public ResponseEntity<List<SellerDealView>> getSellerDeals(@RequestParam Long sellerId) {
        return ResponseEntity.ok(sellerService.getDeals(sellerId));
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<SellerDealView> getDealDetails(@PathVariable Long dealId) {
        return ResponseEntity.ok(sellerService.getDetails(dealId));
    }

    @PostMapping("/deals/{dealId}/decision")
    public ResponseEntity<SellerDealView> decideDeal(
            @PathVariable Long dealId,
            @RequestBody DealDecisionRequest decision
    ) {
        return ResponseEntity.ok(sellerService.confirmDeal(
                dealId,
                decision.decision(),
                decision.reason()
        ));
    }
}
