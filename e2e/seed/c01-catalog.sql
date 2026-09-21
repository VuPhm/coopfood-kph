-- Synthetic local acceptance only. Never load into an operational database.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'coopfood_kph_c01_acceptance' THEN
    RAISE EXCEPTION 'C01 seed requires the isolated acceptance database';
  END IF;
END $$;

INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
VALUES
('11000000-0000-4000-8000-000000000001', 'catalog.c01', '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', 'Quản trị catalog mẫu', TRUE, now(), now()),
('11000000-0000-4000-8000-000000000002', 'employee.c01', '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', 'Nhân viên cửa hàng mẫu', TRUE, now(), now());
INSERT INTO user_roles (user_id, role)
VALUES ('11000000-0000-4000-8000-000000000001', 'CATALOG_ADMIN');

INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at)
VALUES ('21000000-0000-4000-8000-000000000001', 'C01-R', 'Vùng catalog mẫu', TRUE, now(), now());
INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at)
VALUES ('31000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'C01-001', 'Cửa hàng catalog mẫu', TRUE, now(), now());
INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
VALUES ('11000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000001', 'EMPLOYEE', TRUE, now(), now());
COMMIT;
