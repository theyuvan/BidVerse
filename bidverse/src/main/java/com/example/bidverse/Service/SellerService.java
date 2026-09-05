package com.example.bidverse.Service;

import com.example.bidverse.Dto.CreateProductRequest;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SellerService {

    private static final String DEAL_STATUS_PENDING = "pending";
    private static final String DEAL_STATUS_CONFIRMED = "confirmed";
    private static final String DEAL_STATUS_CANCELLED = "cancelled";
    private static final String DECISION_ACCEPT = "accept";
    private static final String DECISION_REJECT = "reject";
    private static final String PRODUCT_STATUS_PENDING = "pending";

    private final DealRepository dealRepository;
    private final ProductRepository productRepository;

    public SellerService(DealRepository dealRepository, ProductRepository productRepository) {
        this.dealRepository = dealRepository;
        this.productRepository = productRepository;
    }

    public List<Deal> getDeals(Long sellerId) {
        return dealRepository.findBySellerId(sellerId);
    }

    public Deal getDetails(Long dealId) {
        return dealRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));
    }

    public Deal confirmDeal(Long dealId, String decision, String reason) {
        String currDecision = decision == null ? "" : decision.trim().toLowerCase();

        if (!currDecision.equals(DECISION_ACCEPT) && !currDecision.equals(DECISION_REJECT)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision must be ACCEPT or REJECT");
        }

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        if (!DEAL_STATUS_PENDING.equalsIgnoreCase(deal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deal is not pending confirmation");
        }

        if (currDecision.equals(DECISION_REJECT)) {
            if (reason == null || reason.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required when rejecting a deal");
            }
            deal.setStatus(DEAL_STATUS_CANCELLED);
            deal.setCancelReason(reason.trim());
        } else {
            deal.setStatus(DEAL_STATUS_CONFIRMED);
        }

        return dealRepository.save(deal);
    }

    public Product getProductDetails(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product Not Found"));
    }

    public Product createProduct(CreateProductRequest request) {
        if (request.basePrice() == null || request.basePrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "basePrice must be greater than 0");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        Product product = new Product();
        product.setSellerId(request.sellerId());
        product.setCategoryId(request.categoryId());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setBasePrice(request.basePrice());
        product.setStatus(PRODUCT_STATUS_PENDING);

        return productRepository.save(product);
    }
}