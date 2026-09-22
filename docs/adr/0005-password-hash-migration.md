# ADR 0005 — Password hash migration cho self-service

Status: Proposed — P05 implementation candidate 2026-09-22

## Bối cảnh

Baseline dùng BCrypt trực tiếp và hash hiện có không có algorithm prefix. BCrypt
cắt đầu vào sau 72 byte, trái với policy cho phép 15–64 Unicode code point và
không được silently truncate. P05 cần mở self-change mà không buộc reset toàn bộ
user hoặc tạo migration chứa secret.

## Quyết định đề xuất

- Dùng Spring Security `DelegatingPasswordEncoder` với hash mới
  `{pbkdf2}...`: PBKDF2-HMAC-SHA256, 600.000 vòng, salt 16 byte, output 256 bit.
- Giữ BCrypt làm encoder đọc cho hash legacy không prefix và `{bcrypt}`. Không
  pre-hash password và không tự chuyển hash khi login; self-change là mutation
  explicit đầu tiên tạo hash mới.
- Thêm `credential_version` trong PostgreSQL. Principal giữ version nội bộ và
  bị invalid khi DB version đổi; version không xuất hiện trong public session.

## Trade-off

PBKDF2 dùng primitive JDK, hỗ trợ toàn bộ input và không thêm crypto provider.
Nó không memory-hard như Argon2id; lựa chọn này ưu tiên deployment ít dependency
cho slice đầu. Trước production rollout phải benchmark trên host mục tiêu và có
thể đổi encoder write sang Argon2id bằng một prefix mới mà vẫn giữ verify hash
cũ qua delegating map.

## Xem xét lại khi

- O02 chọn hosting/profile tài nguyên và có thể benchmark Argon2id thực tế.
- Có yêu cầu FIPS/provider cụ thể, breached-password service hoặc SSO/MFA.
- Thời gian PBKDF2 trên host mục tiêu vượt ngân sách login/change password.

