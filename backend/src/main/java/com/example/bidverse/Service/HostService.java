package com.example.bidverse.Service;

import com.example.bidverse.Dto.RoomProduct;
import com.example.bidverse.Dto.ProductDisplay;
import com.example.bidverse.Dto.CreateRoomRequest;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.ProductDisplayRow;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomProductRow;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.TreeSet;

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
    private static final Set<String> EDITABLE_ROOM_STATUSES = Set.of("upcoming", "open");
    private static final String AUCTION_ITEM_STATUS_WAITING = "waiting";

    private final ProductRepository productRepo;
    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final AuctionService auctionService;

    public HostService(ProductRepository productRepo, RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, AuctionService auctionService) {
        this.productRepo = productRepo;
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.auctionService = auctionService;
    }

    @Transactional
    public Product verifyProduct(Long productId, String status) {
        String decision = status == null ? "" : status.trim().toLowerCase();

        if (!decision.equalsIgnoreCase(STATUS_APPROVED) && !decision.equalsIgnoreCase(STATUS_REJECTED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be APPROVED or REJECTED");
        }

        Product product = productRepo.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (auctionItemRepo.existsByProductId(productId) && !STATUS_APPROVED.equals(decision)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Remove this product from its room before rejecting it");
        }
        product.setStatus(decision);
        return productRepo.save(product);
    }

    public Room startRoom(Long hostId, Long roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        requireOwner(room, hostId);
        return auctionService.startRoom(roomId);
    }

    private void requireOwner(Room room, Long hostId) {
        if (!room.getHostId().equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This room does not belong to you");
        }
    }

    @Transactional
    public auction_item assignProductToRoom(Long hostId, Long productId, Long roomId) {
        Room room = roomRepo.findByIdForUpdate(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        requireOwner(room, hostId);
        Product product = productRepo.findByIdForUpdate(productId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (!STATUS_APPROVED.equalsIgnoreCase(product.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product must be approved before it can be added to a room");
        }

        if (!EDITABLE_ROOM_STATUSES.contains(room.getStatus().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add products to a room that has already started");
        }

        if (auctionItemRepo.existsByProductId(productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is already assigned to a room");
        }

        auction_item item = new auction_item(
                null,
                room.getRoomId(),
                product.getProductId(),
                product.getBasePrice(),
                product.getBasePrice(),
                AUCTION_ITEM_STATUS_WAITING,
                null,
                null
        );

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

        return toProductDisplays(rows);
    }

    public List<ProductDisplay> getAvailableApprovedProducts() {
        return toProductDisplays(productRepo.findAvailableApprovedProducts());
    }

    private List<ProductDisplay> toProductDisplays(List<ProductDisplayRow> rows) {
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
                        row.getStatus(),
                        row.getImageUrl()
                ))
                .toList();
    }

    public Room getRoomDetails(Long roomId) {
        return roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
    }

    public List<RoomProduct> getRoomProducts(Long roomId) {
        roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        return auctionItemRepo.findRoomProductsByRoomId(roomId).stream()
                .map(this::toRoomProduct)
                .toList();
    }

    private RoomProduct toRoomProduct(RoomProductRow row) {
        return new RoomProduct(
                row.getAuctionItemId(),
                row.getProductId(),
                row.getName(),
                row.getDescription(),
                row.getBasePrice(),
                row.getAuctionStatus(),
                row.getImageUrl()
        );
    }

    public Room updateRoomCapacity(Long hostId, Long roomId, Integer seatLimit) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        requireOwner(room, hostId);

        room.setSeatLimit(seatLimit);
        return roomRepo.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepo.findAll();
    }

    @Transactional
    public Room createRoom(Long hostId, CreateRoomRequest request) {
        if (request.title() == null || request.title().isBlank() || request.seatLimit() == null
                || request.seatLimit() < 1 || request.advanceAmount() == null || request.advanceAmount().signum() < 0
                || request.startTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a title, positive seat limit, non-negative advance and start time");
        }
        List<Long> ids = request.productIds() == null
                ? productRepo.findAvailableApprovedProducts().stream().map(ProductDisplayRow::getProductId).toList()
                : request.productIds();

        List<Product> selected = validateSelection(ids, Set.of());
        Room room = new Room();
        room.setHostId(hostId);
        room.setTitle(request.title().trim());
        room.setSeatLimit(request.seatLimit());
        room.setAdvanceAmount(request.advanceAmount());
        room.setStartTime(request.startTime());
        room.setStatus("upcoming");
        Room created = roomRepo.saveAndFlush(room);
        for (Product product : selected) saveLot(created.getRoomId(), product);
        return created;
    }

    @Transactional
    public void replaceRoomProducts(Long hostId, Long roomId, List<Long> ids) {
        Room room = roomRepo.findByIdForUpdate(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        requireOwner(room, hostId);
        if (!EDITABLE_ROOM_STATUSES.contains(room.getStatus().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Products cannot change after the waiting room opens");
        }
        List<auction_item> existing = auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(roomId);
        if (existing.stream().anyMatch(item -> !AUCTION_ITEM_STATUS_WAITING.equals(item.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only unstarted auction products can be changed");
        }
        Set<Long> currentIds = new HashSet<>(existing.stream().map(auction_item::getProductId).toList());
        List<Product> selected = validateSelection(ids, currentIds);
        Set<Long> wanted = new HashSet<>(ids);

        existing.stream().filter(item -> !wanted.contains(item.getProductId())).forEach(auctionItemRepo::delete);
        selected.stream().filter(product -> !currentIds.contains(product.getProductId()))
                .forEach(product -> saveLot(roomId, product));
    }

    private List<Product> validateSelection(List<Long> ids, Set<Long> currentIds) {
        if (ids == null || ids.stream().anyMatch(id -> id == null || id < 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid product selection");
        }
        Set<Long> wanted = new HashSet<>(ids);
        TreeSet<Long> lockIds = new TreeSet<>(currentIds);
        lockIds.addAll(wanted);
        List<Product> selected = new ArrayList<>();
        for (Long id : lockIds) {
            Product product = productRepo.findByIdForUpdate(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "A selected product is no longer available. Refresh and select again"));
            if (!wanted.contains(id)) continue;
            if (!STATUS_APPROVED.equalsIgnoreCase(product.getStatus())
                    || (!currentIds.contains(id) && auctionItemRepo.existsByProductId(id))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A selected product is not approved or is already assigned. Refresh and select again");
            }
            selected.add(product);
        }
        return selected;
    }

    private void saveLot(Long roomId, Product product) {
        auctionItemRepo.save(new auction_item(null, roomId, product.getProductId(), product.getBasePrice(),
                product.getBasePrice(), AUCTION_ITEM_STATUS_WAITING, null, null));
    }
}
