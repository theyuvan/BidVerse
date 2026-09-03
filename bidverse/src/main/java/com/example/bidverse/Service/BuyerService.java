package com.example.bidverse.Service;

import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BuyerService {

    private static final List<String> STARTED_ROOM_STATUSES = List.of("live", "completed", "cancelled");

    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final ProductRepository productRepo;

    public BuyerService(RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, ProductRepository productRepo) {
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.productRepo = productRepo;
    }

    public List<Room> getAvailableRooms() {
        return roomRepo.findByStatusNotIn(STARTED_ROOM_STATUSES);
    }

    public List<Room> searchRooms(String query) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "query must not be empty");
        }
        return roomRepo.search(query.trim());
    }

    public List<CatalogItem> getRoomCatalog(Long roomId) {

        roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        List<auction_item> items = auctionItemRepo.findByRoomId(roomId);

        List<Long> productIds = items.stream().map(auction_item::getProductId).collect(Collectors.toList());

        Map<Long, Product> productsById = productRepo.findAllById(productIds).stream().collect(Collectors.toMap(Product::getProductId, Function.identity()));

        return items.stream()
                .map(item -> {
                    Product product = productsById.get(item.getProductId());
                    return new CatalogItem(
                            item.getAuctionItemId(),
                            item.getProductId(),
                            product == null ? null : product.getName(),
                            product == null ? null : product.getDescription(),
                            product == null ? null : product.getCategoryId(),
                            product == null ? null : product.getBasePrice(),
                            item.getCurrentPrice(),
                            item.getStatus()
                    );
                })
                .collect(Collectors.toList());
    }
}
