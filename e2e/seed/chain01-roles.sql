-- Apply once after admin03-membership.sql in a fresh CHAIN01 PostgreSQL container.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'coopfood_kph_admin03_acceptance' OR current_user <> 'kph_chain01' THEN
    RAISE EXCEPTION 'CHAIN01 requires its dedicated synthetic database and user';
  END IF;
END $$;

INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
SELECT u.id, s.id, 'EMPLOYEE', true, now(), now()
FROM app_users u, stores s WHERE u.username = 'employee.admin03' AND s.store_code = '001';

INSERT INTO app_users (id, username, password_hash, display_name, active, created_at, updated_at)
SELECT '71000000-0000-4000-8000-000000000007', 'managerb.chain01', password_hash,
       'Quản lý cửa hàng B mẫu', true, now(), now()
FROM app_users WHERE username = 'manager.admin03';

INSERT INTO store_memberships (user_id, store_id, role, active, created_at, updated_at)
SELECT u.id, s.id, 'STORE_MANAGER', true, now(), now()
FROM app_users u, stores s WHERE u.username = 'managerb.chain01' AND s.store_code = '002';

UPDATE store_memberships SET active = false, updated_at = now()
WHERE user_id = '71000000-0000-4000-8000-000000000004'
  AND store_id = '73000000-0000-4000-8000-000000000002';
COMMIT;
