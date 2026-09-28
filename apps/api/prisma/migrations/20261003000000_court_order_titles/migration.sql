-- Orders first read from the High Court site took the link text ("View") as their title.
UPDATE "CourtOrder" SET "orderType" = 'Order' WHERE "orderType" = 'View';
