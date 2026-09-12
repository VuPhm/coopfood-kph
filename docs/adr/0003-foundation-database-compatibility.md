# ADR 0003 — Foundation database compatibility

Status: Accepted — 2026-09-09

## Quyết định

Giữ PostgreSQL 17 cho Foundation-01, pin jOOQ OSS 3.20.17 trên Java 21.
[Support matrix](https://www.jooq.org/download/support-matrix) đặt PostgreSQL 17
cho OSS 3.20, trong khi OSS 3.21 yêu cầu PostgreSQL 18.
[Release archive](https://www.jooq.org/download/versions) liệt kê bản 3.20.17.
Override BOM có chủ đích để giữ database hiện tại; full backend verification
phải chạy lại sau thay đổi. Không thay image major hoặc sửa volume đang có dữ liệu.

## Trade-off và xem xét lại

Sở hữu explicit version override thay vì dùng mặc định Spring Boot BOM.
Khi nâng PostgreSQL, thử trên database riêng, kiểm clean/upgrade/restore và support
matrix rồi bỏ override nếu phù hợp. Không có schema/data migration ở quyết định này.
ADR cùng số trong nhánh WIP chưa merge là provenance khác, không được nhập đè.
