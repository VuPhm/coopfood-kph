# Nguyên tắc kỹ thuật

## Mục tiêu

Tối ưu cho phần mềm đúng nghiệp vụ, dễ chạy và dễ bàn giao. Không tối
ưu số dòng code, số dependency hay số abstraction.

## Cách chọn giải pháp

1. Dùng framework/thư viện chuẩn cho security, validation, migration, form,
   server state, media metadata và test container; không tự viết lại rule căn bản.
2. Giữ code custom cho rule domain thực sự: date/HSD, option matrix KPH,
   catalog snapshot, tenant authorization, stamp và Excel outcome.
3. Làm vertical slice nhỏ. Chỉ tách shared package khi có ít nhất một consumer
   thật và ranh giới đã rõ.
4. PostgreSQL là source of truth; browser storage không phải authority.
5. Frontend/backend cộng tác qua OpenAPI, examples và fixture; không chia sẻ
   implementation hoặc chờ nhau cho mock data.
6. Mọi store-scoped query/mutation phải có test cross-store. UI visibility
   không thay cho backend enforcement.
7. Dependency nền, topology, public data contract hoặc thay đổi khó đảo ngược
   cần ADR ngắn có trade-off và điều kiện xem xét lại.

## Không overengineer

- Không microservice, Redis, queue, search engine, Kubernetes, event bus hoặc
  generic repository khi requirement gần chưa cần.
- Không thêm state manager khi form/query/local component state đã đủ.
- Không migration big-bang chỉ để đồng nhất style.
- Không copy nợ kỹ thuật cũ vì nó đã có sẵn.

## Không underengineer

- Không tự viết crypto/session/CSRF, migration runner, spreadsheet parser,
  EXIF parser hoặc focus primitive nếu thư viện phù hợp đã tồn tại.
- Không bỏ test tenant isolation, accessibility, formula injection, private
  media hay database-clean migration để rút ngắn task.
- Không gom logic vào một class/file trung tâm chỉ vì slice đầu còn nhỏ.

