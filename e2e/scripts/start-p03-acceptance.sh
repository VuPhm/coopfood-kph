#!/usr/bin/env bash
set -Eeuo pipefail
# Local macOS preview, separate from Foundation/Store PWA acceptance services.
repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
state_dir="/tmp/coopfood-kph-p03-acceptance"
container_name="coopfood-kph-p03-acceptance"
backend_service="vn.coopfood.kph.p03.backend"
app_service="vn.coopfood.kph.p03.app"
launch_domain="gui/$(id -u)"
for required in docker curl launchctl lsof npm node java; do command -v "$required" >/dev/null; done
docker info >/dev/null 2>&1
if docker inspect "$container_name" >/dev/null 2>&1 \
  || launchctl print "$launch_domain/$backend_service" >/dev/null 2>&1 \
  || launchctl print "$launch_domain/$app_service" >/dev/null 2>&1; then
  printf 'P03 runtime đã tồn tại. Không tự ghi đè dữ liệu; dùng stop-p03-acceptance.sh nếu muốn tạo lại.\n' >&2
  exit 1
fi
for port in 55433 8081 4174; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    printf 'Port %s đang được dùng; không tự dừng process.\n' "$port" >&2
    exit 1
  fi
done
mkdir -p "$state_dir/media"
cd "$repo_root"
./backend/mvnw -q -f backend/pom.xml -DskipTests package
npm --workspace @coopfood-kph/admin-web run build
docker run -d --rm --name "$container_name" --label vn.coopfood.kph.p03.acceptance=true \
  -e POSTGRES_DB=coopfood_kph_p03_acceptance -e POSTGRES_USER=kph_p03 \
  -e POSTGRES_PASSWORD=p03-local-synthetic-only -p 127.0.0.1:55433:5432 postgres:17-alpine >/dev/null
trap 'printf "P03 khởi động lỗi. Log tại /tmp/coopfood-kph-p03-acceptance; dừng bằng stop-p03-acceptance.sh.\n" >&2' ERR
for attempt in {1..30}; do
  if docker exec "$container_name" pg_isready -U kph_p03 >/dev/null 2>&1; then break; fi
  sleep 1
done
launchctl submit -l "$backend_service" -o "$state_dir/backend.log" -e "$state_dir/backend.log" \
  -- /usr/bin/env KPH_DATABASE_URL=jdbc:postgresql://127.0.0.1:55433/coopfood_kph_p03_acceptance \
  KPH_DATABASE_USERNAME=kph_p03 KPH_DATABASE_PASSWORD=p03-local-synthetic-only KPH_MEDIA_ROOT="$state_dir/media" \
  "$(command -v java)" -jar "$repo_root/backend/target/coopfood-kph-backend-0.1.0-SNAPSHOT.jar" \
  --server.address=127.0.0.1 --server.port=8081 \
  --logging.level.org.springframework.boot.security.autoconfigure=ERROR
wait_for_url() {
  for attempt in {1..45}; do
    if curl -fsS "$1" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}
wait_for_url http://127.0.0.1:8081/actuator/health
docker exec -i "$container_name" psql -U kph_p03 -d coopfood_kph_p03_acceptance -v ON_ERROR_STOP=1 \
  < "$repo_root/e2e/seed/p03-lifecycle.sql" >/dev/null
launchctl submit -l "$app_service" -o "$state_dir/app.log" -e "$state_dir/app.log" \
  -- "$(command -v node)" "$repo_root/node_modules/.bin/vite" preview \
  --config "$repo_root/apps/admin-web/vite.config.ts" --outDir "$repo_root/apps/admin-web/dist" \
  --host 127.0.0.1 --port 4174 --strictPort
wait_for_url http://127.0.0.1:4174
git rev-parse HEAD > "$state_dir/revision"
printf 'P03 preview: http://127.0.0.1:4174\nTài khoản giả lập: chain.p03 hoặc region.p03 / admin-e2e-password\n'
