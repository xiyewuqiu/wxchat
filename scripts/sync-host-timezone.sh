#!/usr/bin/env sh
set -eu

ENV_FILE="${1:-.env}"

if command -v timedatectl >/dev/null 2>&1; then
  HOST_TZ="$(timedatectl show -p Timezone --value 2>/dev/null || true)"
fi

if [ -z "${HOST_TZ:-}" ] && [ -f /etc/timezone ]; then
  HOST_TZ="$(head -n 1 /etc/timezone | tr -d '[:space:]')"
fi

if [ -z "${HOST_TZ:-}" ] && [ -L /etc/localtime ]; then
  HOST_TZ="$(readlink /etc/localtime | sed 's#.*zoneinfo/##')"
fi

if [ -z "${HOST_TZ:-}" ]; then
  echo "Could not detect host timezone. Set TZ manually in ${ENV_FILE}." >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cp .env.example "${ENV_FILE}"
fi

if grep -q '^TZ=' "${ENV_FILE}"; then
  tmp_file="${ENV_FILE}.tmp"
  sed "s#^TZ=.*#TZ=${HOST_TZ}#" "${ENV_FILE}" > "${tmp_file}"
  mv "${tmp_file}" "${ENV_FILE}"
else
  printf '\nTZ=%s\n' "${HOST_TZ}" >> "${ENV_FILE}"
fi

echo "Synced ${ENV_FILE} TZ=${HOST_TZ}"
