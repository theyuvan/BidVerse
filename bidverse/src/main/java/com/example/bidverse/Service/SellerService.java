package com.example.bidverse.Service;

<<<<<<< HEAD
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
=======

import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Repository.DealRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SellerService{

    private static final String DEAL_STATUS_PENDING = "pending";
    private static final String DEAL_STATUS_CONFIRMED = "confirmed";
    private static final String DEAL_STATUS_CANCELLED = "cancelled";
    private static final String DECISION_ACCEPT = "accept";
    private static final String DECISION_REJECT = "reject";

    private final DealRepository dealRepository;

    public SellerService(DealRepository dealRepository){
        this.dealRepository = dealRepository;
    }


    public List<Deal> getDeals(Long sellerId){
        return dealRepository.findBySellerId(sellerId);
    }

    public Deal getDetails(Long dealId){
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        return deal;
    }

    public Deal confirmDeal(Long dealId, String decision, String reason) {
        String currDecision = decision == null ? "" : decision.trim().toLowerCase();

        if (!currDecision.equals(DECISION_ACCEPT) && !currDecision.equals(DECISION_REJECT)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision must be ACCEPT or REJECT");
        }

        Deal deal = dealRepository.findById(dealId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

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
>>>>>>> host-approval
    }
}