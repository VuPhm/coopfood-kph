ALTER TABLE date_lots
    ADD COLUMN remind_on DATE;

CREATE INDEX date_lots_store_remind_on_idx ON date_lots(store_id, remind_on, id)
    WHERE processing_status = 'OPEN' AND remind_on IS NOT NULL;
