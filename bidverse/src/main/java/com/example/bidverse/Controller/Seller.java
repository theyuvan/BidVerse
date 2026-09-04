package com.example.bidverse.Controller;
<<<<<<< HEAD
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ListProductRepository;
=======


import com.example.bidverse.Dto.SellerDealDecision;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Service.SellerService;
>>>>>>> host-approval
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

<<<<<<< HEAD
@RestController
@RequestMapping("/seller")
public class Seller {
    private final ListProductRepository productRepo;
    public Seller(ListProductRepository productRepo) {
        this.productRepo = productRepo;
    }
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductDetails(
        @PathVariable Long productId) {

        Product product = productRepo.findById(productId).orElse(null);

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
=======
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
>>>>>>> host-approval
