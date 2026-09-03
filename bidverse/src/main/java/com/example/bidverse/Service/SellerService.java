package com.example.bidverse.Service;

import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ListProductRepository;
import org.springframework.stereotype.Service;

@Service
public class SellerService {

    private final ListProductRepository productRepo;

    public SellerService(ListProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    public Product getProductById(Long productId) {

        return productRepo.findById(productId).orElse(null);
    }

    public Product createProduct(Product product) {

        return productRepo.save(product);
    }
}