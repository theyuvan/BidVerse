package com.example.bidverse.Service;

import com.example.bidverse.Dto.CreateProductRequest;
import com.example.bidverse.Dto.SellerProductHistory;
import com.example.bidverse.Dto.SellerDealView;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Categories;
import com.example.bidverse.Repository.CategoryRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.SellerProductHistoryRow;
import com.example.bidverse.Repository.SellerDealViewRow;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SellerService {

    private static final String DEAL_STATUS_PENDING = "pending";
    private static final String DEAL_STATUS_COMPLETED = "completed";
    private static final String DEAL_STATUS_CANCELLED = "cancelled";
    private static final String PARTY_STATUS_CONFIRMED = "confirmed";
    private static final String PARTY_STATUS_REJECTED = "rejected";
    private static final String DECISION_CONFIRM = "confirm";
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

    public List<SellerDealView> getDeals(Long sellerId) {
        return dealRepository.findDealViewsBySellerId(sellerId).stream()
                .map(this::toSellerDealView)
                .toList();
    }

    public SellerDealView getDetails(Long dealId) {
        return dealRepository.findDealViewById(dealId)
                .map(this::toSellerDealView)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));
    }

    @org.springframework.transaction.annotation.Transactional
    public SellerDealView confirmDeal(Long dealId, String decision, String reason) {
        String currDecision = decision == null ? "" : decision.trim().toLowerCase();

        if (!currDecision.equals(DECISION_CONFIRM) && !currDecision.equals(DECISION_REJECT)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision must be CONFIRM or REJECT");
        }

        Deal deal = dealRepository.findByIdForDecision(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        if (!DEAL_STATUS_PENDING.equalsIgnoreCase(deal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deal is already completed or cancelled");
        }
        if (!DEAL_STATUS_PENDING.equalsIgnoreCase(deal.getSellerStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seller decision has already been submitted");
        }

        if (currDecision.equals(DECISION_REJECT)) {
            if (reason == null || reason.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required when rejecting a deal");
            }
            deal.setSellerStatus(PARTY_STATUS_REJECTED);
            deal.setStatus(DEAL_STATUS_CANCELLED);
            deal.setCancelReason(reason.trim());
        } else {
            deal.setSellerStatus(PARTY_STATUS_CONFIRMED);
            if (PARTY_STATUS_CONFIRMED.equalsIgnoreCase(deal.getBuyerStatus())) {
                deal.setStatus(DEAL_STATUS_COMPLETED);
            }
        }

        dealRepository.saveAndFlush(deal);
        return getDetails(dealId);
    }

    private SellerDealView toSellerDealView(SellerDealViewRow row) {
        return new SellerDealView(
                row.getDealId(),
                row.getAuctionItemId(),
                row.getRoomId(),
                row.getProductId(),
                row.getProductName(),
                row.getProductDescription(),
                row.getImageUrl(),
                row.getFinalPrice(),
                row.getStatus(),
                row.getCancelReason(),
                row.getBuyerStatus(),
                row.getSellerStatus(),
                row.getSellerId(),
                row.getBuyerId(),
                row.getBuyerName(),
                row.getBuyerEmail(),
                row.getBuyerPhone()
        );
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
