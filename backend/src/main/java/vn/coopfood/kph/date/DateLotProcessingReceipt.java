package vn.coopfood.kph.date;

import java.time.Instant;
import java.util.UUID;

record DateLotProcessingReceipt(UUID recordId, String quantity, String unit, long sourceVersion,
        long resultingVersion, String remainingAfter, Instant processedAt, DateLot.Actor actor) {}
