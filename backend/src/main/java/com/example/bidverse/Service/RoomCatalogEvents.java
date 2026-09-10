package com.example.bidverse.Service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.Map;

@Service
public class RoomCatalogEvents {
    private final SimpMessagingTemplate messaging;
    public RoomCatalogEvents(SimpMessagingTemplate messaging) { this.messaging = messaging; }
    public void changed() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { publish(); }
            });
        } else publish();
    }
    private void publish() { messaging.convertAndSend("/topic/rooms", (Object) Map.of("eventType", "ROOMS_CHANGED")); }
}
