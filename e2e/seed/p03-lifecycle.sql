-- Synthetic local acceptance only. Never load into an operational database.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'coopfood_kph_p03_acceptance' THEN
    RAISE EXCEPTION 'P03 seed requires the isolated acceptance database';
  END IF;
END $$;

INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
VALUES
('10000000-0000-4000-8000-000000000001', 'chain.p03', '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', 'Quản trị chuỗi mẫu', TRUE, now(), now()),
('10000000-0000-4000-8000-000000000002', 'region.p03', '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', 'Quản lý vùng B mẫu', TRUE, now(), now()),
('10000000-0000-4000-8000-000000000003', 'manager.p03', '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', 'Quản lý cửa hàng mẫu', TRUE, now(), now());
INSERT INTO user_roles (user_id, role) VALUES ('10000000-0000-4000-8000-000000000001', 'CHAIN_ADMIN');
INSERT INTO regions (id, region_code, region_name, active, created_at, updated_at) VALUES
('20000000-0000-4000-8000-000000000001', 'P03-A', 'Vùng A mẫu', TRUE, now(), now()),
('20000000-0000-4000-8000-000000000002', 'P03-B', 'Vùng B mẫu', TRUE, now(), now());
INSERT INTO stores (id, region_id, store_code, store_name, active, created_at, updated_at) VALUES
('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'P03-001', 'Cửa hàng A mẫu', TRUE, now(), now()),
('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'P03-002', 'Cửa hàng B mẫu', TRUE, now(), now());
INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at) VALUES
('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'STORE_MANAGER', TRUE, now(), now()),
('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'STORE_MANAGER', TRUE, now(), now());
INSERT INTO user_region_assignments (user_id, region_id, active, created_at, updated_at) VALUES
('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', TRUE, now(), now());

-- Historical fixture: schedules created 31 days ago and due today in Vietnam.
-- Normal API always enforces +30 days. No test-only bypass is exposed by HTTP.
INSERT INTO lifecycle_deactivation_schedules
(id, target_type, target_id, effective_date, status, reason, created_by, created_at, updated_by, updated_at)
VALUES
('40000000-0000-4000-8000-000000000001', 'STORE', '30000000-0000-4000-8000-000000000001', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'SCHEDULED', 'Lịch mẫu đến hạn — tạo 31 ngày trước', '10000000-0000-4000-8000-000000000001', now() - interval '31 days', '10000000-0000-4000-8000-000000000001', now() - interval '31 days'),
('40000000-0000-4000-8000-000000000002', 'REGION', '20000000-0000-4000-8000-000000000001', (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'SCHEDULED', 'Lịch vùng mẫu đến hạn — tạo 31 ngày trước', '10000000-0000-4000-8000-000000000001', now() - interval '31 days', '10000000-0000-4000-8000-000000000001', now() - interval '31 days');
COMMIT;
