#!/usr/bin/env bash
set -euo pipefail
# Only the services/container created by start-c01-acceptance.sh are affected.
for service in vn.coopfood.kph.c01.app vn.coopfood.kph.c01.backend; do
  launchctl remove "$service" 2>/dev/null || true
done
container_name="coopfood-kph-c01-acceptance"
if docker inspect "$container_name" >/dev/null 2>&1; then
  label="$(docker inspect --format '{{ index .Config.Labels "vn.coopfood.kph.c01.acceptance" }}' "$container_name")"
  [[ "$label" == true ]] || { printf 'Container không có label C01; từ chối dừng.\n' >&2; exit 1; }
  docker stop "$container_name" >/dev/null
  printf 'Đã bỏ database giả lập C01 (--rm), không thể khôi phục; có thể tạo lại từ seed.\n'
fi
printf 'Đã dừng preview C01; giữ log tại /tmp/coopfood-kph-c01-acceptance.\n'
