package com.example.bidverse.Controller;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Dto.SellerProductItem;
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

        Product product = sellerService.getProductById(productId);

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
        return ResponseEntity.ok(sellerService.getProductsBySeller(sellerId));
    }

    @GetMapping("/products/history")
    public ResponseEntity<List<SellerProductItem>> getProductHistory(@RequestParam Long sellerId) {
        return ResponseEntity.ok(sellerService.getProductHistory(sellerId));
    }
}
