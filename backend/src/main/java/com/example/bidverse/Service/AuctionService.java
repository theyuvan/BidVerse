package com.example.bidverse.Service;

import com.example.bidverse.Dto.AuctionUpdate;
import com.example.bidverse.Dto.BidError;
import com.example.bidverse.Dto.BidMessage;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.User;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Entity.bid;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.BidRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import com.example.bidverse.Repository.UserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuctionService {

    private static final String ITEM_STATUS_WAITING = "waiting";
    private static final String ITEM_STATUS_LIVE = "live";
    private static final String ITEM_STATUS_SOLD = "sold";
    private static final String ITEM_STATUS_UNSOLD = "unsold";
    private static final String ROOM_STATUS_WAITING = "waiting";
    private static final String ROOM_STATUS_LIVE = "live";

    private static final String DEAL_STATUS_PENDING = "pending";

    private static final long BID_INACTIVITY_SECONDS = 20;
    private static final long WAITING_ROOM_SECONDS = 90;
    private static final long SOLD_RESULT_SECONDS = 15;
    private static final long UNSOLD_RESULT_SECONDS = 20;
    private static final Set<Integer> QUICK_BID_PERCENTAGES = Set.of(2, 5, 10);
    private static final List<String> AUTO_STARTABLE_ROOM_STATUSES = List.of("upcoming", "open");

    private final AuctionItemRepository auctionItemRepo;
    private final RoomRepo roomRepo;
    private final RoomSeatRepository roomSeatRepo;
    private final ProductRepository productRepo;
    private final BidRepository bidRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectProvider<AuctionService> self;



    private final Map<Long, Intermission> intermissions = new ConcurrentHashMap<>();

    private static final class Intermission {
        final auction_item item;
        final String status;
        final String winner;
        final OffsetDateTime deadline;
        final Set<Long> participants;
        final Set<Long> ready = new HashSet<>();
        boolean finishing;
        Intermission(auction_item item, String status, String winner, OffsetDateTime deadline, Set<Long> participants) {
            this.item = item;
            this.status = status;
            this.winner = winner;
            this.deadline = deadline;
            this.participants = participants;
        }
    }

    public AuctionService(AuctionItemRepository auctionItemRepo,
                           RoomRepo roomRepo,
                           RoomSeatRepository roomSeatRepo,
                           ProductRepository productRepo,
                           BidRepository bidRepository,
                           DealRepository dealRepository,
                           UserRepository userRepository,
                           SimpMessagingTemplate messagingTemplate,
                           ObjectProvider<AuctionService> self) {
        this.auctionItemRepo = auctionItemRepo;
        this.roomRepo = roomRepo;
        this.roomSeatRepo = roomSeatRepo;
        this.productRepo = productRepo;
        this.bidRepository = bidRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.self = self;
    }

    @Transactional
    public void activateFirstItem(Room room) {
        List<auction_item> items = auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(room.getRoomId());
        items.stream()
                .filter(i -> ITEM_STATUS_WAITING.equals(i.getStatus()))
                .findFirst()
                .ifPresent(this::activateItem);
    }


    @Transactional
    public Room startRoom(Long roomId) {

        roomRepo.findByIdForUpdate(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (auctionItemRepo.findByRoomId(roomId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Add at least one approved product before starting the room");
        }

        OffsetDateTime now = OffsetDateTime.now();
        int started = roomRepo.beginWaitingIfNotStarted(roomId, now);
        if (started == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room has already started or ended");
        }

        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        broadcastCurrentState(roomId, null, "WAITING_STARTED", "Waiting room is open for 90 seconds");
        return room;
    }

    @Scheduled(fixedRate = 1000)
    public void autoStartDueRooms() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Room> dueRooms = roomRepo.findByStatusInAndStartTimeLessThanEqual(AUTO_STARTABLE_ROOM_STATUSES, now);

        for (Room room : dueRooms) {
            if (auctionItemRepo.findByRoomId(room.getRoomId()).isEmpty()) {
                continue;
            }
            try {
                self.getObject().startRoom(room.getRoomId());
            } catch (ResponseStatusException ignored) {

            }
        }
    }

    @Scheduled(fixedRate = 1000)
    public void openWaitingRooms() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusSeconds(WAITING_ROOM_SECONDS);
        List<Room> waitingRooms = roomRepo.findByStatus(ROOM_STATUS_WAITING);

        for (Room room : waitingRooms) {
            if (room.getWaitingStartedAt() != null && !room.getWaitingStartedAt().isAfter(cutoff)) {
                self.getObject().openBidding(room.getRoomId());
            }
        }
    }

    @Transactional
    public void openBidding(Long roomId) {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime cutoff = now.minusSeconds(WAITING_ROOM_SECONDS);
        int updated = roomRepo.goLiveIfWaiting(roomId, cutoff, now);
        if (updated == 0) {
            return;
        }

        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        activateFirstItem(room);
    }

    @Scheduled(fixedRate = 2000)
    public void healStalledRooms() {
        List<Room> liveRooms = roomRepo.findByStatus(ROOM_STATUS_LIVE);
        for (Room room : liveRooms) {
            if (intermissions.containsKey(room.getRoomId())) {
                continue;
            }
            List<auction_item> items = auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(room.getRoomId());
            boolean hasLiveItem = items.stream().anyMatch(i -> ITEM_STATUS_LIVE.equals(i.getStatus()));
            boolean hasWaitingItem = items.stream().anyMatch(i -> ITEM_STATUS_WAITING.equals(i.getStatus()));
            if (!hasLiveItem) {
                if (restoreIntermission(room.getRoomId(), items) == null && hasWaitingItem) {
                    self.getObject().activateFirstItem(room);
                }
            }
        }
    }

    @Scheduled(fixedRate = 1000)
    public void resolvePendingIntermissions() {
        OffsetDateTime now = OffsetDateTime.now();
        for (Map.Entry<Long, Intermission> entry : intermissions.entrySet()) {
            if (!entry.getValue().deadline.isAfter(now)) {
                self.getObject().finishIntermission(entry.getKey(), entry.getValue().item.getAuctionItemId());
            }
        }
    }

    public AuctionUpdate getCurrentState(Long roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        Optional<auction_item> liveItem = auctionItemRepo.findByRoomIdAndStatus(roomId, ITEM_STATUS_LIVE);
        if (liveItem.isPresent()) {
            return buildUpdate(roomId, liveItem.get(), "SNAPSHOT", null);
        }
        if (ROOM_STATUS_LIVE.equals(room.getStatus())) {
            Intermission pause = intermissions.get(roomId);
            if (pause == null) pause = restoreIntermission(roomId,
                    auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(roomId));
            if (pause != null) {
                synchronized (pause) { return resultUpdate(pause); }
            }
        }
        return new AuctionUpdate(roomId, null, null, null, null, null, null, null,
                waitingSecondsRemaining(room), room.getStatus(), "SNAPSHOT", null,
                null, null, null, null, null);
    }


    @Transactional
    public void placeBid(Long roomId, BidMessage message) {
        if (message == null) {
            return;
        }

        Long auctionItemId = message.auctionItemId();
        Long buyerId = message.buyerId();

        if (auctionItemId == null || buyerId == null) {
            sendError(roomId, buyerId, auctionItemId, "auctionItemId and buyerId are required");
            return;
        }

        auction_item item = auctionItemRepo.findById(auctionItemId).orElse(null);
        if (item == null || !item.getRoomId().equals(roomId)) {
            sendError(roomId, buyerId, auctionItemId, "This item is not up for auction in this room");
            return;
        }

        if (!ITEM_STATUS_LIVE.equals(item.getStatus())) {
            sendError(roomId, buyerId, auctionItemId, "Bidding for this item is not currently open");
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (item.getEndedAt() != null && !item.getEndedAt().isAfter(now)) {
            sendError(roomId, buyerId, auctionItemId, "Bidding time is over for this item");
            return;
        }

        if (!roomSeatRepo.existsByRoomIdAndBuyerIdAndAttendanceStatus(roomId, buyerId, "joined")) {
            sendError(roomId, buyerId, auctionItemId, "You must enter this room during the waiting period before bidding");
            return;
        }

        BigDecimal currentPrice = item.getCurrentPrice();
        BigDecimal targetAmount;

        if (isAutoMode(message.mode())) {
            int percent = message.incrementPercent() == null ? 5 : message.incrementPercent();
            if (!QUICK_BID_PERCENTAGES.contains(percent)) {
                sendError(roomId, buyerId, auctionItemId, "Choose a quick bid of 2%, 5%, or 10%");
                return;
            }
            BigDecimal increment = item.getStartPrice().multiply(BigDecimal.valueOf(percent)).movePointLeft(2)
                    .setScale(2, RoundingMode.HALF_UP).max(new BigDecimal("0.01"));
            targetAmount = currentPrice.add(increment).setScale(2, RoundingMode.HALF_UP);
        } else {
            if (!"MANUAL".equalsIgnoreCase(message.mode())) {
                sendError(roomId, buyerId, auctionItemId, "Choose AUTO or MANUAL bidding");
                return;
            }
            if (message.amount() == null) {
                sendError(roomId, buyerId, auctionItemId, "amount is required for a manual bid");
                return;
            }
            targetAmount = message.amount().setScale(2, RoundingMode.HALF_UP);
            if (targetAmount.compareTo(currentPrice) <= 0) {
                sendError(roomId, buyerId, auctionItemId,
                        "Your bid must be higher than the current price of " + currentPrice);
                return;
            }
        }

        OffsetDateTime newDeadline = now.plusSeconds(BID_INACTIVITY_SECONDS);
        int updated = auctionItemRepo.acceptBidAndResetDeadline(
                auctionItemId, currentPrice, targetAmount, now, newDeadline);
        if (updated == 0) {
            sendError(roomId, buyerId, auctionItemId,
                    "Bid was not accepted because another bid arrived first or bidding has ended");
            return;
        }

        bidRepository.upsertBid(auctionItemId, buyerId, targetAmount, now);

        broadcastCurrentState(roomId, auctionItemId, "BID_PLACED",
                "Buyer " + buyerId + " raised the bid to " + targetAmount);
    }

    private boolean isAutoMode(String mode) {
        return mode == null || mode.isBlank() || mode.equalsIgnoreCase("AUTO");
    }


    @Scheduled(fixedRate = 1000)
    public void sweepExpiredRounds() {
        OffsetDateTime now = OffsetDateTime.now();
        List<auction_item> liveItems = auctionItemRepo.findByStatus(ITEM_STATUS_LIVE);
        for (auction_item item : liveItems) {
            if (item.getEndedAt() != null && !item.getEndedAt().isAfter(now)) {
                self.getObject().resolveAndAdvance(item);
            }
        }
    }

    private void activateItem(auction_item item) {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime deadline = now.plusSeconds(BID_INACTIVITY_SECONDS);
        int updated = auctionItemRepo.activateIfWaiting(item.getAuctionItemId(), now, deadline);
        if (updated > 0) {
            broadcastCurrentState(item.getRoomId(), item.getAuctionItemId(), "ITEM_ACTIVATED", "Bidding is now open");
        }
    }

    @Transactional
    public void resolveAndAdvance(auction_item item) {
        OffsetDateTime now = OffsetDateTime.now();
        boolean hasBids = bidRepository.existsByAuctionItemId(item.getAuctionItemId());
        String newStatus = hasBids ? ITEM_STATUS_SOLD : ITEM_STATUS_UNSOLD;

        int resolved = auctionItemRepo.resolveExpiredIfLive(item.getAuctionItemId(), newStatus, now);
        if (resolved == 0) {
            return;
        }

        String winningBuyerName = ITEM_STATUS_SOLD.equals(newStatus) ? createDeal(item) : null;
        Intermission pause = new Intermission(item, newStatus, winningBuyerName,
                now.plusSeconds(ITEM_STATUS_SOLD.equals(newStatus) ? SOLD_RESULT_SECONDS : UNSOLD_RESULT_SECONDS),
                Set.copyOf(roomSeatRepo.findJoinedBuyerIds(item.getRoomId())));
        intermissions.put(item.getRoomId(), pause);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) intermissions.remove(item.getRoomId(), pause);
                }
            });
        }
        AuctionUpdate result = resultUpdate(pause);
        afterCommit(() -> messagingTemplate.convertAndSend("/topic/room/" + item.getRoomId(), result));
    }

    private Intermission restoreIntermission(Long roomId, List<auction_item> items) {
        return items.stream().filter(i -> Set.of(ITEM_STATUS_SOLD, ITEM_STATUS_UNSOLD).contains(i.getStatus()))
                .max(Comparator.comparing(auction_item::getAuctionItemId))
                .map(item -> intermissions.computeIfAbsent(roomId, key -> {
                    String winner = bidRepository.findTopByAuctionItemIdOrderByAmountDesc(item.getAuctionItemId())
                            .flatMap(b -> userRepository.findById(b.getBuyerId())).map(User::getName).orElse(null);
                    OffsetDateTime ended = item.getEndedAt() == null ? OffsetDateTime.now() : item.getEndedAt();
                    return new Intermission(item, item.getStatus(), winner,
                            ended.plusSeconds(ITEM_STATUS_SOLD.equals(item.getStatus()) ? SOLD_RESULT_SECONDS : UNSOLD_RESULT_SECONDS),
                            Set.copyOf(roomSeatRepo.findJoinedBuyerIds(roomId)));
                })).orElse(null);
    }

    public void acknowledgeResult(Long roomId, Long itemId, Long buyerId) {
        Intermission pause = intermissions.get(roomId);
        if (pause == null || !pause.item.getAuctionItemId().equals(itemId)) return;
        synchronized (pause) {
            if (intermissions.get(roomId) != pause || pause.finishing) return;
            if (!pause.participants.contains(buyerId)) {
                sendError(roomId, buyerId, itemId, "Only buyers who entered this room can continue.");
                return;
            }
            pause.ready.add(buyerId);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, resultUpdate(pause));
            if (!pause.participants.isEmpty() && pause.ready.containsAll(pause.participants)) {
                self.getObject().finishIntermission(roomId, itemId);
            }
        }
    }

    @Transactional
    public void finishIntermission(Long roomId, Long itemId) {
        Intermission pause = intermissions.get(roomId);
        if (pause == null) return;
        synchronized (pause) {
            if (intermissions.get(roomId) != pause || pause.finishing || !pause.item.getAuctionItemId().equals(itemId)) return;
            if (pause.deadline.isAfter(OffsetDateTime.now())
                    && (pause.participants.isEmpty() || !pause.ready.containsAll(pause.participants))) return;

            if (auctionItemRepo.findByRoomIdAndStatus(roomId, ITEM_STATUS_LIVE).isPresent()) {
                intermissions.remove(roomId, pause);
                return;
            }
            pause.finishing = true;
            boolean transactional = TransactionSynchronizationManager.isSynchronizationActive();
            if (transactional) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCompletion(int status) {
                        synchronized (pause) {
                            if (status == STATUS_COMMITTED) intermissions.remove(roomId, pause);
                            else pause.finishing = false;
                        }
                    }
                });
            }
            try {
                Optional<auction_item> next = auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(roomId)
                    .stream().filter(i -> ITEM_STATUS_WAITING.equals(i.getStatus())).findFirst();
                if (next.isPresent()) activateItem(next.get());
                else if (roomRepo.completeIfLive(roomId) > 0) {
                    broadcastCurrentState(roomId, null, "ROOM_COMPLETED", "Auction finished. Review your winning deals.");
                }
                if (!transactional) intermissions.remove(roomId, pause);
            } catch (RuntimeException exception) {
                if (!transactional) pause.finishing = false;
                throw exception;
            }
        }
    }

    private AuctionUpdate resultUpdate(Intermission pause) {
        auction_item item = pause.item;
        Product product = productRepo.findById(item.getProductId()).orElse(null);
        Long winnerId = bidRepository.findTopByAuctionItemIdOrderByAmountDesc(item.getAuctionItemId())
                .map(bid::getBuyerId).orElse(null);
        auction_item next = auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(item.getRoomId()).stream()
                .filter(i -> ITEM_STATUS_WAITING.equals(i.getStatus())).findFirst().orElse(null);
        Product nextProduct = next == null ? null : productRepo.findById(next.getProductId()).orElse(null);
        return new AuctionUpdate(item.getRoomId(), item.getAuctionItemId(), item.getProductId(),
                product == null ? null : product.getName(), item.getCurrentPrice(), winnerId, pause.status,
                null, null, "live", "ITEM_RESOLVED",
                ITEM_STATUS_SOLD.equals(pause.status) ? (pause.winner == null ? "Sold!" : "Sold to " + pause.winner + "!") : "No bids — item unsold",
                pause.winner, Math.max(0, (Duration.between(OffsetDateTime.now(), pause.deadline).toMillis() + 999) / 1000),
                next == null ? null : next.getProductId(), nextProduct == null ? null : nextProduct.getName(),
                nextProduct == null ? null : nextProduct.getImageUrl(), pause.deadline, Set.copyOf(pause.ready), pause.participants.size());
    }

    private String createDeal(auction_item item) {
        if (dealRepository.existsByAuctionItemId(item.getAuctionItemId())) {
            return null;
        }

        bid winningBid = bidRepository.findTopByAuctionItemIdOrderByAmountDesc(item.getAuctionItemId()).orElse(null);

        if (winningBid == null) {
            return null;
        }

        Product product = productRepo.findById(item.getProductId()).orElse(null);

        if (product == null) {
            return null;
        }

        Deal deal = new Deal();
        deal.setAuctionItemId(item.getAuctionItemId());
        deal.setBuyerId(winningBid.getBuyerId());
        deal.setSellerId(product.getSellerId());
        deal.setFinalPrice(item.getCurrentPrice());
        deal.setStatus(DEAL_STATUS_PENDING);
        deal.setBuyerStatus(DEAL_STATUS_PENDING);
        deal.setSellerStatus(DEAL_STATUS_PENDING);
        dealRepository.save(deal);

        return userRepository.findById(winningBid.getBuyerId()).map(User::getName).orElse(null);
    }


    private void broadcastCurrentState(Long roomId, Long auctionItemId, String eventType, String message) {
        auction_item item = auctionItemId == null ? null : auctionItemRepo.findById(auctionItemId).orElse(null);
        AuctionUpdate update = buildUpdate(roomId, item, eventType, message);
        afterCommit(() -> messagingTemplate.convertAndSend("/topic/room/" + roomId, update));
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { action.run(); }
        });
    }

    private AuctionUpdate buildUpdate(Long roomId, auction_item item, String eventType, String message) {
        Room room = roomRepo.findById(roomId).orElse(null);

        if (item == null) {
            return new AuctionUpdate(roomId, null, null, null, null, null, null, null,
                    waitingSecondsRemaining(room), room == null ? null : room.getStatus(), eventType, message,
                    null, null, null, null, null);
        }

        Product product = productRepo.findById(item.getProductId()).orElse(null);
        Long highestBidderId = bidRepository.findTopByAuctionItemIdOrderByAmountDesc(item.getAuctionItemId())
                .map(bid::getBuyerId)
                .orElse(null);

        Long secondsRemaining = null;
        if (ITEM_STATUS_LIVE.equals(item.getStatus()) && item.getEndedAt() != null) {
            secondsRemaining = Math.max(Duration.between(OffsetDateTime.now(), item.getEndedAt()).getSeconds(), 0);
        }

        String displayStatus = ITEM_STATUS_WAITING.equals(item.getStatus()) ? "upcoming" : item.getStatus();

        return new AuctionUpdate(
                roomId,
                item.getAuctionItemId(),
                item.getProductId(),
                product == null ? null : product.getName(),
                item.getCurrentPrice(),
                highestBidderId,
                displayStatus,
                secondsRemaining,
                null,
                room == null ? null : room.getStatus(),
                eventType,
                message,
                null,
                null,
                null,
                null,
                null
        );
    }

    private Long waitingSecondsRemaining(Room room) {
        if (room == null || !ROOM_STATUS_WAITING.equalsIgnoreCase(room.getStatus())
                || room.getWaitingStartedAt() == null) {
            return null;
        }

        OffsetDateTime liveAt = room.getWaitingStartedAt().plusSeconds(WAITING_ROOM_SECONDS);
        return Math.max(Duration.between(OffsetDateTime.now(), liveAt).getSeconds(), 0);
    }

    private void sendError(Long roomId, Long buyerId, Long auctionItemId, String message) {
        if (buyerId == null) {
            return;
        }
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/buyer/" + buyerId,
                new BidError(auctionItemId, message));
    }
}
