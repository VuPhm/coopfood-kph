#!/usr/bin/env bash
set -euo pipefail
# Only the services/container created by start-p03-acceptance.sh are affected.
for service in vn.coopfood.kph.p03.app vn.coopfood.kph.p03.backend; do
  launchctl remove "$service" 2>/dev/null || true
done
container_name="coopfood-kph-p03-acceptance"
if docker inspect "$container_name" >/dev/null 2>&1; then
  label="$(docker inspect --format '{{ index .Config.Labels "vn.coopfood.kph.p03.acceptance" }}' "$container_name")"
  [[ "$label" == true ]] || { printf 'Container không có label P03; từ chối dừng.\n' >&2; exit 1; }
  docker stop "$container_name" >/dev/null
  printf 'Đã bỏ database giả lập P03 (--rm), không thể khôi phục; có thể tạo lại từ seed.\n'
fi
printf 'Đã dừng preview P03; giữ log tại /tmp/coopfood-kph-p03-acceptance.\n'
