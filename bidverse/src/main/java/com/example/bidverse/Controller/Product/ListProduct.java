package com.example.bidverse.Controller.Product;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ListProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/seller")
public class ListProduct {
    private final ListProductRepository productRepo;
    public ListProduct(ListProductRepository productRepo) {
        this.productRepo = productRepo;
    }
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductDetails(
        @PathVariable Long productId) {

        Product product = productRepo.findByProductId(productId);

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
        productRepo.save(product);
        return new ResponseEntity<>(
                "Product Created Successfully",
                HttpStatus.CREATED
        );
    }
}
