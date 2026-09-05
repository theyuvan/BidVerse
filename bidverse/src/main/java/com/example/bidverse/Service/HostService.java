package com.example.bidverse.Service;

import com.example.bidverse.Dto.ProductDisplay;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.ProductDisplayRow;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
public class HostService {

    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_REJECTED = "rejected";
    private static final Set<String> PRODUCT_STATUSES = Set.of(
            STATUS_APPROVED,
            STATUS_PENDING,
            STATUS_REJECTED
    );
    private static final String ROOM_STATUS_LIVE = "live";
    private static final String AUCTION_ITEM_STATUS_WAITING = "waiting";

    private final ProductRepository productRepo;
    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;

    public HostService(ProductRepository productRepo, RoomRepo roomRepo, AuctionItemRepository auctionItemRepo) {
        this.productRepo = productRepo;
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
    }

    public Product verifyProduct(Long productId, String status) {
        String decision = status == null ? "" : status.trim().toLowerCase();

        if (!decision.equalsIgnoreCase(STATUS_APPROVED) && !decision.equalsIgnoreCase(STATUS_REJECTED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be APPROVED or REJECTED");
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        product.setStatus(decision);
        return productRepo.save(product);
    }

    public Room startRoom(Long roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        room.setStatus(ROOM_STATUS_LIVE);
        room.setStartTime(OffsetDateTime.now());
        return roomRepo.save(room);
    }

    public auction_item assignProductToRoom(Long productId, Long roomId) {
        Product product = productRepo.findById(productId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (!STATUS_APPROVED.equalsIgnoreCase(product.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product must be approved before it can be added to a room");
        }

        Room room = roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (ROOM_STATUS_LIVE.equalsIgnoreCase(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add products to a room that has already started");
        }

        if (auctionItemRepo.existsByProductId(productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is already assigned to a room");
        }

        auction_item item = new auction_item();
        item.setRoomId(room.getRoomId());
        item.setProductId(product.getProductId());
        item.setStartPrice(product.getBasePrice());
        item.setCurrentPrice(product.getBasePrice());
        item.setStatus(AUCTION_ITEM_STATUS_WAITING);

        return auctionItemRepo.save(item);
    }

    public List<ProductDisplay> getProducts(String status) {
        List<ProductDisplayRow> rows;

        if (status == null || status.isBlank()) {
            rows = productRepo.findAllDisplayProducts();
        } else {
            String normalizedStatus = status.trim().toLowerCase();
            if (!PRODUCT_STATUSES.contains(normalizedStatus)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "status must be approved, pending, or rejected"
                );
            }
            rows = productRepo.findDisplayProductsByStatus(normalizedStatus);
        }

        return rows.stream()
                .map(row -> new ProductDisplay(
                        row.getProductId(),
                        row.getSellerId(),
                        row.getSellerName(),
                        row.getCategoryId(),
                        row.getCategoryName(),
                        row.getProductName(),
                        row.getDescription(),
                        row.getBasePrice(),
                        row.getStatus()
                ))
                .toList();
    }

    public Room getRoomDetails(Long roomId) {
        return roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
    }

    public Room updateRoomCapacity(Long roomId, Integer seatLimit) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        room.setSeatLimit(seatLimit);
        return roomRepo.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepo.findAll();
    }

    public Room createRoom(Room room) {
        return roomRepo.save(room);
    }
}