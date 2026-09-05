package com.example.bidverse.Controller;

import com.example.bidverse.Dto.CreateProductRequest;
import com.example.bidverse.Dto.SellerDealDecision;
import com.example.bidverse.Dto.UpdateProduct;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Service.SellerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seller")
public class Seller {
    private final ProductRepository productRepository;
    private final SellerService sellerService;

    public Seller(
            ProductRepository productRepository,
            SellerService sellerService) {

        this.productRepository = productRepository;
        this.sellerService = sellerService;
    }

    @GetMapping("/{sellerId}/deals")
    public ResponseEntity<List<Deal>> displayDeals(
            @PathVariable Long sellerId) {

        return ResponseEntity.ok(sellerService.getDeals(sellerId));
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<Deal> dealDetails(
            @PathVariable Long dealId) {

        return ResponseEntity.ok(sellerService.getDetails(dealId));
    }

    @PostMapping("/deals/{dealId}/confirm")
    public ResponseEntity<Deal> confirmDeal(
            @PathVariable Long dealId,
            @RequestBody SellerDealDecision request) {

        return ResponseEntity.ok(
                sellerService.confirmDeal(
                        dealId,
                        request.decision(),
                        request.reason()
                )
        );
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<Product> getProductDetails(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                sellerService.getProductDetails(productId)
        );
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(
            @RequestBody CreateProductRequest request) {

        return new ResponseEntity<>(
                sellerService.createProduct(request),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/{sellerId}/products")
    public ResponseEntity<List<Product>> getSellerProducts(
            @PathVariable Long sellerId) {

        return ResponseEntity.ok(
                productRepository.findBySellerId(sellerId)
        );
    }

    @PatchMapping("/products/{productId}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long productId,
            @RequestBody UpdateProduct dto) {

        Product product = sellerService.updateProduct(
                productId,
                dto.name(),
                dto.description(),
                dto.basePrice()
        );

        return new ResponseEntity<>(
                product,
                HttpStatus.OK
        );
    }
}