#!/usr/bin/env bash
set -Eeuo pipefail
# Local source preview only; does not publish or change the backend runtime.
repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
state_dir="$repo_root/.local/runtime/admin02"
service="vn.coopfood.kph.admin02.app"
domain="gui/$(id -u)"
for required in node launchctl lsof; do command -v "$required" >/dev/null; done
if launchctl print "$domain/$service" >/dev/null 2>&1; then
  printf 'Admin02 service đã tồn tại. Kiểm tra source và log trước khi restart: %s/app.log\n' "$state_dir" >&2
  exit 1
fi
if lsof -nP -iTCP:4175 -sTCP:LISTEN >/dev/null 2>&1; then
  printf 'Port4175 đang được dùng; không tự dừng process hoặc chuyển cổng.\n' >&2
  exit 1
fi
mkdir -p "$state_dir"
launchctl submit -l "$service" -o "$state_dir/app.log" -e "$state_dir/app.log" \
  -- "$(command -v node)" "$repo_root/node_modules/.bin/vite" "$repo_root/apps/admin-web" \
  --config "$repo_root/apps/admin-web/vite.config.ts" --host 127.0.0.1 --port 4175 --strictPort
printf 'Admin source: %s\nPreview: http://127.0.0.1:4175\nLog: %s/app.log\n' "$repo_root" "$state_dir"
