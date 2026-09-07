# Bidverse frontend

## Run locally

Start the Spring Boot backend on port `8080`, then run:

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` if the backend URL or default test buyer ID is different.

## Test the live auction

1. Open `/buyer`, choose a buyer ID, and book an upcoming room.
2. Open that room from **My booked rooms**. The waiting page will enter automatically when the room starts.
3. In another browser tab, open the host room and select **Start auction now**.
4. Return to the buyer tab and place a quick or manual bid.

The live page connects to the Spring STOMP endpoint at `/ws`. Auction updates arrive on `/topic/room/{roomId}`, while buyer-specific bid errors arrive on `/topic/room/{roomId}/buyer/{buyerId}`.
