-- Align the persisted KPH vocabulary with the locked OpenAPI and golden policy.
-- Unit casing is a lossless normalization. The legacy DAMAGED condition is
-- preserved as OTHER with explicit provenance because it cannot be split safely
-- between the two accepted TPTS condition codes.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM kph_records
        WHERE unit = 'EA'
          AND quantity <> trunc(quantity)
    ) THEN
        RAISE EXCEPTION USING
            MESSAGE = 'Cannot enforce whole-number quantity for legacy EA records',
            DETAIL = 'Update fractional EA quantities to the verified whole-unit value before applying V2.';
    END IF;
END
$$;

ALTER TABLE kph_records
    -- Keep the submitted precision so CHECKs validate the actual quantity.
    -- NUMERIC(12, 3) would round fractional EA before the integer check runs.
    ALTER COLUMN quantity TYPE NUMERIC,
    DROP CONSTRAINT kph_records_unit_check,
    DROP CONSTRAINT kph_records_condition_code_check,
    DROP CONSTRAINT kph_records_check;

UPDATE kph_records
SET unit = 'kg'
WHERE unit = 'KG';

UPDATE kph_records
SET condition_code = 'OTHER',
    condition_detail = CASE
        WHEN condition_detail IS NULL OR btrim(condition_detail) = ''
            THEN 'Legacy condition: DAMAGED'
        ELSE 'Legacy condition: DAMAGED; ' || condition_detail
    END
WHERE condition_code = 'DAMAGED';

ALTER TABLE kph_records
    ADD CONSTRAINT kph_records_unit_allowed
        CHECK (unit IN ('EA', 'kg')),
    ADD CONSTRAINT kph_records_quantity_by_unit
        CHECK (unit <> 'EA' OR quantity = trunc(quantity)),
    ADD CONSTRAINT kph_records_condition_allowed
        CHECK (condition_code IN (
            'NEAR_EXPIRY',
            'EXPIRED',
            'TORN_PACKAGING',
            'VACUUM_LEAK',
            'BRUISED_WATERLOGGED',
            'ROTTEN_MOLDY',
            'OTHER'
        )),
    ADD CONSTRAINT kph_records_condition_by_type
        CHECK (
            (type = 'TPCN' AND condition_code IN (
                'NEAR_EXPIRY', 'EXPIRED', 'TORN_PACKAGING', 'VACUUM_LEAK', 'OTHER'
            ))
            OR
            (type = 'TPTS' AND condition_code IN (
                'BRUISED_WATERLOGGED', 'ROTTEN_MOLDY', 'NEAR_EXPIRY', 'EXPIRED', 'OTHER'
            ))
        ),
    ADD CONSTRAINT kph_records_resolution_by_type
        CHECK (
            (type = 'TPCN' AND resolution_code IN ('CANCEL', 'EXCHANGE', 'RETURN', 'OTHER'))
            OR
            (type = 'TPTS' AND resolution_code IN ('CANCEL', 'OTHER'))
        );
