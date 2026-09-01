# Architecture Decision Records

ADR chỉ ghi quyết định có tác động dài hạn hoặc khó đảo ngược. Dùng tên
`NNNN-ten-ngan.md` và một trong các trạng thái `Proposed`, `Accepted`,
`Superseded`, `Rejected`.

Mỗi ADR ngắn gồm: bối cảnh, quyết định, trade-off, hệ quả và điều kiện
xem xét lại. Hợp đồng nghiệp vụ không được thay đổi ngầm qua ADR kỹ
thuật.

ADR accepted hiện hành:

- `0001-foundation-stack.md`: stack đích của hệ thống online.
- `0002-local-only-pilot-pwa.md`: ngoại lệ có thời hạn cho nhánh PWA pilot,
  dùng IndexedDB làm authority trên từng thiết bị và chưa đồng bộ.
