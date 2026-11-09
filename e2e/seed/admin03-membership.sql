-- Synthetic isolated acceptance only; never load into an operational database.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'coopfood_kph_admin03_acceptance' THEN
    RAISE EXCEPTION 'ADMIN03 seed requires the isolated acceptance database';
  END IF;
END $$;
INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
SELECT ('71000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid, username,
       '$2y$10$eysDc6n9JmdvO.R1Fy6JD.wgwMex7Sbwwie/Hf0EpsusE0LSeYVi6', display_name, active, now(), now()
FROM (VALUES
 (1,'chain.admin03','Quản trị chuỗi mẫu',TRUE),
 (2,'region.admin03','Quản lý vùng Nam mẫu',TRUE),
 (3,'employee.admin03','Nhân viên thử quyền',TRUE),
 (4,'manager.admin03','Quản lý cửa hàng mẫu',TRUE),
 (5,'inactive.admin03','Tài khoản mẫu đã ngừng',FALSE),
 (6,'catalog.admin03','Quản trị catalog mẫu',TRUE)
) AS users(n,username,display_name,active);
INSERT INTO user_roles (user_id,role) VALUES
 ('71000000-0000-4000-8000-000000000001','CHAIN_ADMIN'),
 ('71000000-0000-4000-8000-000000000006','CATALOG_ADMIN');
INSERT INTO regions (id,region_code,region_name,active,created_at,updated_at) VALUES
 ('72000000-0000-4000-8000-000000000001','01','Vùng Nam mẫu',TRUE,now(),now()),
 ('72000000-0000-4000-8000-000000000002','02','Vùng Bắc mẫu',TRUE,now(),now());
INSERT INTO stores (id,region_id,store_code,store_name,active,created_at,updated_at) VALUES
 ('73000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','001','Cửa hàng An Phú mẫu',TRUE,now(),now()),
 ('73000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000002','002','Cửa hàng Bắc mẫu',TRUE,now(),now());
INSERT INTO user_region_assignments (user_id,region_id,active,created_at,updated_at) VALUES
 ('71000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001',TRUE,now(),now());
INSERT INTO store_memberships (user_id,store_id,role,active,created_at,updated_at) VALUES
 ('71000000-0000-4000-8000-000000000004','73000000-0000-4000-8000-000000000001','STORE_MANAGER',TRUE,now(),now()),
 ('71000000-0000-4000-8000-000000000004','73000000-0000-4000-8000-000000000002','STORE_MANAGER',TRUE,now(),now()),
 ('71000000-0000-4000-8000-000000000005','73000000-0000-4000-8000-000000000001','EMPLOYEE',TRUE,now(),now());
COMMIT;
