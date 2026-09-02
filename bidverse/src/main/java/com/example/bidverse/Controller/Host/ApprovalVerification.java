package com.example.bidverse.Controller.Host;

import com.example.bidverse.Dto.ProductDecisionRequest;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/host")
public class ApprovalVerififcation {
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";
    private final ProductRepo productRepo;

    public Host(ProductRepo productRepo) {
        this.productRepo = productRepo;
    }

    @GetMapping("/products/pending")
    public ResponseEntity<List<Product>> getPendingProducts() {
        return ResponseEntity.ok(productRepo.findByStatus("PENDING"));
    }

    @PostMapping("/products/{productId}/verify")
    public ResponseEntity<?> verifyProduct(@PathVariable Long productId,@RequestBody ProductStatus request) {
        String decision = request.status() == null ? "" : request.status().trim().toUpperCase();

        if (!decision.equalsIgnoreCase(STATUS_APPROVED) && !decision.equalsIgnoreCase(STATUS_REJECTED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be APPROVED or REJECTED");
        }

        Product product = productRepo.findById(productId);
        if(product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        product.setStatus(decision);
        productRepo.save(product);
        return new ResponseEntity<>("Product Verified Successfully",HttpStatus.OK);
    }

}