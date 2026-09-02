package com.example.bidverse.Controller.Host;

import com.example.bidverse.Dto.ProductStatus;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/host")
public class ApprovalVerification {

    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_REJECTED = "rejected";

    private final ProductRepository productRepo;

    public ApprovalVerification(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    @GetMapping("/products/pending")
    public ResponseEntity<List<Product>> getPendingProducts() {

        return ResponseEntity.ok(
                productRepo.findByStatus("pending")
        );
    }

    @PostMapping("/products/{productId}/verify")
    public ResponseEntity<?> verifyProduct(
            @PathVariable Long productId,
            @RequestBody ProductStatus request) {

        String decision =
                request.status() == null
                        ? ""
                        : request.status().trim().toLowerCase();

        if (!decision.equals(STATUS_APPROVED)
                && !decision.equals(STATUS_REJECTED)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status must be APPROVED or REJECTED"
            );
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Product not found"
                        )
                );

        product.setStatus(decision);

        productRepo.save(product);

        return new ResponseEntity<>(
                "Product Verified Successfully",
                HttpStatus.OK
        );
    }
}