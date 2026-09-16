#!/usr/bin/env bash
set -u

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "${script_dir}/../.." && pwd)"
state_dir="/tmp/coopfood-kph-online-acceptance"
media_dir="${state_dir}/media"
container_name="coopfood-kph-online-acceptance"
container_label="vn.coopfood.kph.acceptance"
backend_service="vn.coopfood.kph.acceptance.backend"
app_service="vn.coopfood.kph.acceptance.app"
launch_domain="gui/$(id -u)"
quiet=false
[[ "${1:-}" == "--quiet" ]] && quiet=true
exit_code=0

say() {
  [[ "${quiet}" == true ]] || printf '%s\n' "$1"
}

stop_managed_service() {
  local service="$1"
  launchctl print "${launch_domain}/${service}" >/dev/null 2>&1 || return 0
  say "Dừng ${service}..."
  launchctl remove "${service}" >/dev/null 2>&1 || exit_code=1
}

if command -v launchctl >/dev/null 2>&1; then
  stop_managed_service "${app_service}"
  stop_managed_service "${backend_service}"
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 \
  && docker inspect "${container_name}" >/dev/null 2>&1; then
  marker="$(docker inspect --format "{{ index .Config.Labels \"${container_label}\" }}" "${container_name}" 2>/dev/null || true)"
  if [[ "${marker}" == "true" ]]; then
    say "Dừng PostgreSQL acceptance container..."
    docker stop --time 3 "${container_name}" >/dev/null || exit_code=1
  else
    printf 'Từ chối dừng container %s: thiếu acceptance marker.\n' "${container_name}" >&2
    exit_code=1
  fi
fi

if [[ -d "${media_dir}" && "${media_dir}" == "${state_dir}/media" ]]; then
  rm -rf -- "${media_dir}"
fi

if [[ "${exit_code}" -eq 0 ]]; then
  say "Online acceptance đã dừng. Logs/build được giữ tại ${state_dir}."
fi
exit "${exit_code}"
