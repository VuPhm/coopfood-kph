# Source manifest

Cập nhật: 2026-08-15. Mọi nguồn dưới đây là read-only provenance; không
phải dependency runtime của repository mới.

## Repository nguồn

| Nguồn | Revision | Vai trò |
|---|---|---|
| `/Users/vup/Documents/tool-kph` | `c4592977409ab6cff001b754d7fed86fd8d1e4e3` | Legacy behavior, UI DNA, image stamp và generated Excel provenance |
| `/Users/vup/Documents/coopfood-kph-platform` | `c75db8dd455b8f6a4f867e9e770e284156503d26` + working-tree UI changes ghi bên dưới | Contract extraction, executable synthetic fixtures, session/store/KPH implementation evidence và khung UI đã closeout |

Platform working tree đang có thay đổi chưa commit; không được gán nhầm
chúng cho commit trên. Khung UI mới nhất được nhận diện bằng SHA-256:

| File tham chiếu | SHA-256 |
|---|---|
| `apps/store-pwa/index.html` | `e5bde0b4f50f477f9a8a2f953e8ccaa1671459460a15a5f152aed625a1d6182e` |
| `apps/store-pwa/src/main.ts` | `83d3d8ae2a017130630c7411b2e8c02ab81dd3a24d7d128d4822dad791ff2e9b` |
| `apps/store-pwa/src/styles.css` | `6b0b15770b665f79ab0f66dfeb0fbbb2615ab8b75f22e447ee421196ab4be8a2` |
| Diff của ba file trên so với `c75db8d...` | `803d108da03c20b4994f056f25e9e5a97d80daa54985161601ed26b7a0abd13e` |

Ba file trên là visual/interaction evidence để port sang component, không phải
code được copy nguyên. DOM imperative, CSS override và mock state cũ không phải
contract.

## Tài liệu đã mang sang

| File mới | Nguồn platform | SHA-256 nguồn |
|---|---|---|
| `docs/product/DOMAIN_RULES.md` | `docs/DOMAIN_RULES.md` | `ded4dfdf51bcf4933df02b0cd55e7fa5303e462efa2b2ff0368e517c6ada57f3` |
| `docs/product/UI_DNA.md` | `docs/legacy/UI_DNA.md` | `b037cfa590e9b40094dfe0b8256d437cdd308b5b2ae241c897e29feb68640dd5` |
| `docs/product/BEHAVIOR_INVENTORY.md` | `docs/legacy/BEHAVIOR_INVENTORY.md` | `a1666d246a6d00a96ba2dc3dd3630305664c1707296df0b30c2d4d5277c6d79f` |
| `docs/product/SCREEN_MAP.md` | `docs/legacy/SCREEN_MAP.md` | `c90df851d054f771a1e7f7689e8aef52b3b41f53616e320faca4bd22c41f7e3f` |

Nội dung được copy để giữ trace ID. Ghi chú reboot được thêm ở
đầu tài liệu; mọi gate/milestone F1–F5 bên trong là bối cảnh extraction
lịch sử. `docs/CURRENT_STATE.md` và `docs/NEXT.md` là trạng thái hiện hành.

## Fixture đã mang sang

Tất cả file trong `contracts/fixtures/` là dữ liệu tổng hợp, không chứa dữ
liệu vận hành. Chúng được copy từ
`backend/src/test/resources/{catalog,golden}` của platform revision nêu trên.
`fixture-manifest.json` là entry point và giữ trace về behavior IDs.

## Quyết định được mang theo

- Modular monolith; PostgreSQL là source of truth.
- API date là ISO `date`, UI là `dd/mm/yyyy`, timezone
  `Asia/Ho_Chi_Minh`; audit timestamp tách business date.
- Barcode lookup `0 hoặc 1`; identifier luôn là string.
- Backend session/membership quyết định actor và store authority.
- Phiếu giữ catalog snapshot; original/stamped media đều private.
- UI legacy là baseline đã được chọn, nhưng accessibility debt,
  localStorage authority, hard delete, memory-only data và minified bundle bị loại.

## Chưa được suy diễn

- Hosting, SSO/MFA, retention và production object storage.
- Primary supplier khi product/SKU có nhiều NCC.
- Cửa sổ edit/approve, emergency override và full approval workflow.
- Logo trong workbook; legacy export không chèn logo.
- Redis, queue, microservice, offline outbox hoặc multi-instance session.

