package com.example.bidverse.Service;

import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.BuyerWonDeal;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.BuyerWonDealRow;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BuyerService {

    private static final List<String> BOOKABLE_ROOM_STATUSES = List.of("upcoming", "open", "waiting", "live");
    private static final List<String> UPCOMING_ROOM_STATUSES = List.of("upcoming", "open");
    private static final String ROOM_STATUS_LIVE = "live";
    private static final String ROOM_STATUS_WAITING = "waiting";
    private static final String ROOM_STATUS_COMPLETED = "completed";
    private static final String ROOM_STATUS_CANCELLED = "cancelled";
    private static final String ADVANCE_STATUS_PAID = "paid";
    private static final String ATTENDANCE_STATUS_BOOKED = "booked";
    private static final String ATTENDANCE_STATUS_JOINED = "joined";
    private static final String REFUND_STATUS_PENDING = "pending";
    private static final String DEAL_STATUS_PENDING = "pending";
    private static final String DEAL_STATUS_COMPLETED = "completed";
    private static final String DEAL_STATUS_CANCELLED = "cancelled";
    private static final String PARTY_STATUS_CONFIRMED = "confirmed";
    private static final String PARTY_STATUS_REJECTED = "rejected";
    private static final String DECISION_CONFIRM = "confirm";
    private static final String DECISION_REJECT = "reject";
    private static final int BID_DURATION_SECONDS = 10;
    private static final long MIN_ROOM_DURATION_SECONDS = 3600;

    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final RoomSeatRepository roomSeatRepo;
    private final DealRepository dealRepo;

    public BuyerService(RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, RoomSeatRepository roomSeatRepo, DealRepository dealRepo) {
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.roomSeatRepo = roomSeatRepo;
        this.dealRepo = dealRepo;
    }

    public List<BuyerWonDeal> getDeals(Long buyerId) {
        return dealRepo.findWonDealsByBuyerId(buyerId).stream()
                .map(this::toBuyerWonDeal)
                .toList();
    }

    private BuyerWonDeal toBuyerWonDeal(BuyerWonDealRow row) {
        return new BuyerWonDeal(
                row.getDealId(),
                row.getAuctionItemId(),
                row.getRoomId(),
                row.getProductId(),
                row.getProductName(),
                row.getProductDescription(),
                row.getImageUrl(),
                row.getFinalPrice(),
                row.getDealStatus(),
                row.getCancelReason(),
                row.getBuyerStatus(),
                row.getSellerStatus(),
                row.getSellerId(),
                row.getSellerName(),
                row.getSellerEmail(),
                row.getSellerPhone()
        );
    }

    public List<Room> getAvailableRooms(Long buyerId) {
        return roomRepo.findAvailableForBuyer(buyerId);
    }

    public List<Room> searchRooms(Long buyerId, String query) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "query must not be empty");
        }
        return roomRepo.searchAvailableForBuyer(buyerId, query.trim());
    }

    public List<CatalogItem> getRoomCatalog(Long roomId) {
        roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        var rows = auctionItemRepo.findCatalogByRoomId(roomId);
        return java.util.stream.IntStream.range(0, rows.size())
                .mapToObj(index -> {
                    var row = rows.get(index);
                    String displayStatus = "waiting".equals(row.getAuctionStatus())
                            ? "upcoming"
                            : row.getAuctionStatus();
                    return new CatalogItem(
                            index + 1,
                            row.getAuctionItemId(),
                            row.getProductId(),
                            row.getProductName(),
                            row.getDescription(),
                            row.getCategoryId(),
                            row.getCategoryName(),
                            row.getBasePrice(),
                            row.getCurrentPrice(),
                            displayStatus,
                            row.getImageUrl()
                    );
                })
                .toList();
    }

    public Room getRoomDetails(Long roomId) {
        return roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
    }

    public Room_Seat bookRoom(Long roomId, Long buyerId) {

        Room room = roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (!BOOKABLE_ROOM_STATUSES.contains(room.getStatus() == null ? "" : room.getStatus().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not open for booking");
        }

        if (roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Buyer already has a seat booked in this room");
        }

        List<CatalogItem> catalogItemList = getRoomCatalog(roomId);
        if(catalogItemList.isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room has no products. Booking is not allowed.");
        }

        assertNoOverlappingBooking(room, buyerId);

        long bookedSeats = roomSeatRepo.countByRoomId(roomId);
        if (bookedSeats >= room.getSeatLimit()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is fully booked");
        }

        Room_Seat seat = new Room_Seat();
        seat.setRoomId(roomId);
        seat.setBuyerId(buyerId);
        seat.setAdvanceAmount(room.getAdvanceAmount());
        seat.setAdvanceStatus(ADVANCE_STATUS_PAID);
        seat.setAttendanceStatus(ATTENDANCE_STATUS_BOOKED);
        seat.setRefundStatus(REFUND_STATUS_PENDING);

        return roomSeatRepo.save(seat);
    }

    private void assertNoOverlappingBooking(Room room, Long buyerId) {
        List<Room_Seat> existingBookings = roomSeatRepo.findByBuyerId(buyerId);
        if (existingBookings.isEmpty()) {
            return;
        }

        List<Long> otherRoomIds = existingBookings.stream()
                .map(Room_Seat::getRoomId)
                .filter(id -> !id.equals(room.getRoomId()))
                .collect(Collectors.toList());
        if (otherRoomIds.isEmpty()) {
            return;
        }

        OffsetDateTime newStart = room.getStartTime();
        OffsetDateTime newEnd = estimateRoomEndTime(room);

        List<Room> otherRooms = roomRepo.findAllById(otherRoomIds);
        for (Room otherRoom : otherRooms) {


            if (ROOM_STATUS_CANCELLED.equalsIgnoreCase(otherRoom.getStatus())
                    || ROOM_STATUS_COMPLETED.equalsIgnoreCase(otherRoom.getStatus())) {
                continue;
            }

            OffsetDateTime otherStart = otherRoom.getStartTime();
            OffsetDateTime otherEnd = estimateRoomEndTime(otherRoom);

            boolean overlaps = newStart.isBefore(otherEnd) && otherStart.isBefore(newEnd);
            if (overlaps) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Buyer already has a seat booked in \"" + otherRoom.getTitle() + "\" during this time slot");
            }
        }
    }

    private OffsetDateTime estimateRoomEndTime(Room room) {
        long itemCount = auctionItemRepo.findByRoomId(room.getRoomId()).size();
        long durationSeconds = Math.max(itemCount * (long) BID_DURATION_SECONDS, MIN_ROOM_DURATION_SECONDS);
        return room.getStartTime().plusSeconds(durationSeconds);
    }

    public List<BookingSummary> displayBookings(Long buyerId, String status) {

        String filter = status == null || status.isBlank() ? null : status.trim().toLowerCase();
        if (filter != null && !filter.equals("upcoming") && !filter.equals("waiting")
                && !filter.equals("live") && !filter.equals("completed")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "status must be one of: upcoming, waiting, live, completed");
        }

        List<Room_Seat> bookings = roomSeatRepo.findByBuyerId(buyerId);

        List<Long> roomIds = bookings.stream().map(Room_Seat::getRoomId).collect(Collectors.toList());
        Map<Long, Room> roomsById = roomRepo.findAllById(roomIds).stream()
                .collect(Collectors.toMap(Room::getRoomId, Function.identity()));

        return bookings.stream()
                .map(seat -> {
                    Room room = roomsById.get(seat.getRoomId());
                    String roomStatus = room == null ? null : room.getStatus();
                    return new BookingSummary(
                            seat.getRoomSeatId(),
                            seat.getRoomId(),
                            room == null ? null : room.getTitle(),
                            roomStatus,
                            room == null ? null : room.getStartTime(),
                            seat.getAdvanceAmount(),
                            seat.getAdvanceStatus(),
                            ROOM_STATUS_WAITING.equalsIgnoreCase(roomStatus)
                                    || ROOM_STATUS_LIVE.equalsIgnoreCase(roomStatus),
                            room == null ? null : room.getWaitingStartedAt(),
                            seat.getJoinedAt(),
                            seat.getAttendanceStatus(),
                            seat.getRefundStatus()
                    );
                })
                .filter(booking -> matchesStatusFilter(booking.roomStatus(), filter))
                .collect(Collectors.toList());
    }

    private boolean matchesStatusFilter(String roomStatus, String filter) {
        if (filter == null) {
            return true;
        }
        String normalizedStatus = roomStatus == null ? "" : roomStatus.toLowerCase();
        return switch (filter) {
            case "upcoming" -> UPCOMING_ROOM_STATUSES.contains(normalizedStatus);
            case "waiting" -> ROOM_STATUS_WAITING.equals(normalizedStatus);
            case "live" -> ROOM_STATUS_LIVE.equals(normalizedStatus);
            case "completed" -> ROOM_STATUS_COMPLETED.equals(normalizedStatus);
            default -> false;
        };
    }

    @Transactional
    public List<LiveAuctionItem> joinRoom(Long roomId, Long buyerId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        String roomStatus = room.getStatus() == null ? "" : room.getStatus().toLowerCase();
        if (ROOM_STATUS_COMPLETED.equals(roomStatus)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Auction has completed");
        }
        if (ROOM_STATUS_CANCELLED.equals(roomStatus)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Auction was cancelled");
        }
        if (!ROOM_STATUS_WAITING.equals(roomStatus) && !ROOM_STATUS_LIVE.equals(roomStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Waiting room is not open yet");
        }

        if (!roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You must book a seat in this room before joining");
        }

        roomSeatRepo.markBuyerJoined(roomId, buyerId, OffsetDateTime.now());

        return auctionItemRepo.findLiveAuctionItemsByRoomId(roomId).stream()
                .map(row -> new LiveAuctionItem(
                        row.getAuctionItemId(),
                        row.getProductId(),
                        row.getProductName(),
                        row.getCategoryName(),
                        row.getSellerName(),
                        row.getBasePrice(),
                        row.getCurrentPrice(),
                        row.getAuctionStatus(),
                        row.getImageUrl()
                ))
                .toList();
    }

    public BuyerWonDeal getDealDetails(Long dealId) {
        return dealRepo.findWonDealById(dealId)
                .map(this::toBuyerWonDeal)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));
    }

    public BuyerWonDeal getOwnDealDetails(Long dealId, Long buyerId) {
        BuyerWonDeal deal = getDealDetails(dealId);
        if (!dealRepo.findById(dealId).map(d -> d.getBuyerId().equals(buyerId)).orElse(false)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This deal does not belong to you");
        }
        return deal;
    }

    @Transactional
    public BuyerWonDeal decideDeal(Long buyerId, Long dealId, String decision, String reason) {
        String normalizedDecision = decision == null ? "" : decision.trim().toLowerCase();
        if (!DECISION_CONFIRM.equals(normalizedDecision) && !DECISION_REJECT.equals(normalizedDecision)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "decision must be CONFIRM or REJECT");
        }

        Deal deal = dealRepo.findByIdForDecision(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        if (!deal.getBuyerId().equals(buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This deal does not belong to you");
        }
        if (!DEAL_STATUS_PENDING.equalsIgnoreCase(deal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deal is already completed or cancelled");
        }
        if (!DEAL_STATUS_PENDING.equalsIgnoreCase(deal.getBuyerStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Buyer decision has already been submitted");
        }

        if (DECISION_REJECT.equals(normalizedDecision) && (reason == null || reason.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required when rejecting a deal");
        }

        if (DECISION_REJECT.equals(normalizedDecision)) {
            deal.setBuyerStatus(PARTY_STATUS_REJECTED);
            deal.setStatus(DEAL_STATUS_CANCELLED);
            deal.setCancelReason(reason.trim());
        } else {
            deal.setBuyerStatus(PARTY_STATUS_CONFIRMED);
            if (PARTY_STATUS_CONFIRMED.equalsIgnoreCase(deal.getSellerStatus())) {
                deal.setStatus(DEAL_STATUS_COMPLETED);
            }
        }

        dealRepo.saveAndFlush(deal);
        return getDealDetails(dealId);
    }
}
