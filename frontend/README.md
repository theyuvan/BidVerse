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
2. Open that room from **My booked rooms**. Leave the page open while it waits for the host.
3. In another browser tab, open the host room and select **Start auction now**.
4. The buyer is entered into the 90-second waiting room automatically. Buyers who do not enter before the countdown ends are marked absent and their advance is forfeited.
5. When the room becomes live, place a quick or manual bid. Every accepted bid restarts the product's 10-second timer.

The live page connects to the Spring STOMP endpoint at `/ws`. Auction updates arrive on `/topic/room/{roomId}`, while buyer-specific bid errors arrive on `/topic/room/{roomId}/buyer/{buyerId}`.

Before starting the backend against an existing database, run `bidverse/database/auction-waiting-room.sql` once.
