package com.example.bidverse.Service;

import com.example.bidverse.Dto.CreateProductRequest;
import com.example.bidverse.Dto.SellerProductHistory;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Categories;
import com.example.bidverse.Repository.CategoryRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.SellerProductHistoryRow;
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
    private final CategoryRepository categoryRepository;

    public SellerService(
            DealRepository dealRepository,
            ProductRepository productRepository,
            CategoryRepository categoryRepository
    ) {
        this.dealRepository = dealRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Categories> getCategories() {
        return categoryRepository.findAll();
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

    public List<Product> getProducts(Long sellerId) {
        if (sellerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sellerId is required");
        }
        return productRepository.findBySellerId(sellerId);
    }

    public List<SellerProductHistory> getProductHistory(Long sellerId) {
        if (sellerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sellerId is required");
        }
        return productRepository.findHistoryBySellerId(sellerId).stream()
                .map(this::toSellerProductHistory)
                .toList();
    }

    private SellerProductHistory toSellerProductHistory(SellerProductHistoryRow row) {
        return new SellerProductHistory(
                row.getProductId(),
            row.getCategoryId(),
            row.getCategoryName(),
                row.getName(),
                row.getDescription(),
                row.getBasePrice(),
                row.getProductStatus(),
                row.getImageUrl(),
                row.getRoomId(),
                row.getAuctionStatus(),
                row.getDealStatus(),
                row.getBuyerId(),
                row.getBuyerName(),
                row.getBuyerEmail(),
                row.getBuyerPhone()
        );
    }

    public Product createProduct(Product product2) {
        if (product2.getBasePrice() == null || product2.getBasePrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "basePrice must be greater than 0");
        }
        if (product2.getName() == null || product2.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        Product product = new Product();
        product.setSellerId(product2.getSellerId());
        product.setCategoryId(product2.getCategoryId());
        product.setName(product2.getName());
        product.setDescription(product2.getDescription());
        product.setBasePrice(product2.getBasePrice());
        product.setStatus(PRODUCT_STATUS_PENDING);

        return productRepository.save(product);
    }
}
