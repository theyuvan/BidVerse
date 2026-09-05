package com.example.bidverse.Service;

import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.User;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Dto.SellerProductItem;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ListProductRepository;
import com.example.bidverse.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private final ListProductRepository productRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final DealRepository dealRepo;
    private final UserRepository userRepo;

    public SellerService(ListProductRepository productRepo, AuctionItemRepository auctionItemRepo,
                         DealRepository dealRepo, UserRepository userRepo) {
        this.productRepo = productRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.dealRepo = dealRepo;
        this.userRepo = userRepo;
    }

    public Product getProductById(Long productId) {

        return productRepo.findById(productId).orElse(null);
    }

    public Product createProduct(Product product) {
        product.setStatus("pending");
        return productRepo.save(product);
    }

    public List<Product> getProductsBySeller(Long sellerId) {
        return productRepo.findBySellerId(sellerId);
    }

    public List<SellerProductItem> getProductHistory(Long sellerId) {
        List<Product> products = getProductsBySeller(sellerId);
        List<Long> productIds = products.stream().map(Product::getProductId).toList();
        Map<Long, auction_item> auctionItems = auctionItemRepo.findAll().stream()
                .filter(item -> productIds.contains(item.getProductId()))
                .collect(Collectors.toMap(auction_item::getProductId, Function.identity(), (first, second) -> first));

        return products.stream().map(product -> {
            auction_item item = auctionItems.get(product.getProductId());
            Deal deal = item == null ? null : dealRepo.findByAuctionItemId(item.getAuctionItemId()).orElse(null);
                String dealStatus = deal == null ? null : deal.getStatus();
                boolean sold = dealStatus != null && (dealStatus.equalsIgnoreCase("sold")
                    || dealStatus.equalsIgnoreCase("confirmed")
                    || dealStatus.equalsIgnoreCase("completed"));
                User buyer = !sold ? null : userRepo.findById(deal.getBuyerId()).orElse(null);
            return new SellerProductItem(
                    product.getProductId(), product.getName(), product.getDescription(), product.getBasePrice(),
                    product.getStatus(), item == null ? null : item.getRoomId(),
                    item == null ? null : item.getStatus(), dealStatus,
                    buyer == null ? null : buyer.getId(), buyer == null ? null : buyer.getName(),
                    buyer == null ? null : buyer.getEmail(), buyer == null ? null : buyer.getPhone()
            );
        }).toList();
    }
}