#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "${script_dir}/../.." && pwd)"
state_dir="/tmp/coopfood-kph-online-acceptance"
dist_dir="${state_dir}/online-dist"
media_dir="${state_dir}/media"
backend_log="${state_dir}/backend.log"
app_log="${state_dir}/app.log"
container_name="coopfood-kph-online-acceptance"
container_label="vn.coopfood.kph.acceptance"
backend_service="vn.coopfood.kph.acceptance.backend"
app_service="vn.coopfood.kph.acceptance.app"
launch_domain="gui/$(id -u)"
backend_jar="${repo_root}/backend/target/coopfood-kph-backend-0.1.0-SNAPSHOT.jar"
seed_file="${repo_root}/e2e/seed/foundation-01.sql"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Thiếu lệnh bắt buộc: %s\n' "$1" >&2
    exit 1
  }
}

service_is_loaded() {
  launchctl print "${launch_domain}/$1" >/dev/null 2>&1
}

port_is_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempt
  for attempt in $(seq 1 60); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  printf '%s chưa sẵn sàng sau 60 giây: %s\n' "${name}" "${url}" >&2
  return 1
}

print_access() {
  printf '\nOnline acceptance đã sẵn sàng.\n'
  printf 'URL:       http://127.0.0.1:4173\n'
  printf 'CHT:       manager.e2e / manager-e2e-password\n'
  printf 'Nhân viên: employee.e2e / employee-e2e-password\n'
  printf 'Logs:      %s\n' "${state_dir}"
  printf 'Dừng:      ./e2e/scripts/stop-online-acceptance.sh\n\n'
}

for command_name in docker curl launchctl lsof npm node java; do
  require_command "${command_name}"
done

docker info >/dev/null 2>&1 || {
  printf 'Docker chưa sẵn sàng. Hãy khởi động OrbStack/Docker Desktop rồi chạy lại.\n' >&2
  exit 1
}

if service_is_loaded "${backend_service}" && service_is_loaded "${app_service}" \
  && [[ "$(docker inspect --format '{{.State.Running}}' "${container_name}" 2>/dev/null || true)" == "true" ]] \
  && curl -fsS http://127.0.0.1:8080/actuator/health >/dev/null 2>&1 \
  && curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1; then
  print_access
  exit 0
fi

if service_is_loaded "${backend_service}" || service_is_loaded "${app_service}" \
  || docker inspect "${container_name}" >/dev/null 2>&1; then
  printf 'Có runtime acceptance cũ nhưng chưa khỏe. Hãy chạy stop script trước.\n' >&2
  exit 1
fi

for port in 55432 8080 4173; do
  if port_is_busy "${port}"; then
    printf 'Port %s đang được process khác sử dụng; không tự dừng process đó.\n' "${port}" >&2
    exit 1
  fi
done

mkdir -p "${state_dir}" "${media_dir}"
: >"${backend_log}"
: >"${app_log}"

cleanup_on_error() {
  local exit_code=$?
  trap - ERR INT TERM
  printf '\nKhởi động không hoàn tất. Đang thu hồi runtime đã tạo...\n' >&2
  "${script_dir}/stop-online-acceptance.sh" --quiet || true
  [[ -f "${backend_log}" ]] && tail -n 60 "${backend_log}" >&2 || true
  [[ -f "${app_log}" ]] && tail -n 30 "${app_log}" >&2 || true
  exit "${exit_code}"
}
trap cleanup_on_error ERR INT TERM

printf '1/5 Khởi động PostgreSQL 17 tổng hợp...\n'
docker run -d --rm \
  --name "${container_name}" \
  --label "${container_label}=true" \
  -e POSTGRES_DB=coopfood_kph_e2e \
  -e POSTGRES_USER=kph_e2e \
  -e POSTGRES_PASSWORD=local-e2e-only \
  -p 127.0.0.1:55432:5432 \
  postgres:17-alpine >/dev/null

for attempt in $(seq 1 60); do
  if docker exec "${container_name}" pg_isready -U kph_e2e -d coopfood_kph_e2e >/dev/null 2>&1; then
    break
  fi
  if [[ "${attempt}" -eq 60 ]]; then
    printf 'PostgreSQL chưa sẵn sàng sau 60 giây.\n' >&2
    exit 1
  fi
  sleep 1
done

printf '2/5 Build backend jar...\n'
(cd "${repo_root}" && ./backend/mvnw -q -f backend/pom.xml -DskipTests package)
[[ -f "${backend_jar}" ]] || {
  printf 'Không tìm thấy backend jar: %s\n' "${backend_jar}" >&2
  exit 1
}

printf '3/5 Build Store PWA online...\n'
(cd "${repo_root}" && env VITE_KPH_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir "${dist_dir}" --emptyOutDir)

printf '4/5 Khởi động backend và nạp fixture tổng hợp...\n'
launchctl submit \
  -l "${backend_service}" \
  -o "${backend_log}" \
  -e "${backend_log}" \
  -- /usr/bin/env \
  KPH_DATABASE_URL=jdbc:postgresql://127.0.0.1:55432/coopfood_kph_e2e \
  KPH_DATABASE_USERNAME=kph_e2e \
  KPH_DATABASE_PASSWORD=local-e2e-only \
  KPH_MEDIA_ROOT="${media_dir}" \
  "$(command -v java)" -jar "${backend_jar}"
wait_for_url "Backend" "http://127.0.0.1:8080/actuator/health"

docker exec -i "${container_name}" \
  psql -U kph_e2e -d coopfood_kph_e2e -v ON_ERROR_STOP=1 \
  <"${seed_file}" >/dev/null
node "${script_dir}/seed-foundation-paging-media.mjs" "${media_dir}"

printf '5/5 Khởi động online preview...\n'
launchctl submit \
  -l "${app_service}" \
  -o "${app_log}" \
  -e "${app_log}" \
  -- "$(command -v node)" "${repo_root}/node_modules/.bin/vite" preview \
  --host 127.0.0.1 \
  --port 4173 \
  --strictPort \
  --config "${repo_root}/apps/store-pwa/vite.config.ts" \
  --outDir "${dist_dir}"
wait_for_url "Store PWA" "http://127.0.0.1:4173/"

git -C "${repo_root}" rev-parse HEAD >"${state_dir}/revision"
trap - ERR INT TERM
print_access
