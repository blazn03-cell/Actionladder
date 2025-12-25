#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <service-account.json> [SECRET_NAME]"
  echo "Defaults SECRET_NAME=GOOGLE_SERVICE_ACCOUNT_JSON"
  exit 2
}

if [ $# -lt 1 ]; then
  usage
fi

FILE="$1"
SECRET_NAME="${2:-GOOGLE_SERVICE_ACCOUNT_JSON}"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Install from https://cli.github.com/" >&2
  exit 1
fi

ENCODED=$(base64 "$FILE" | tr -d '\n')

echo "Uploading secret $SECRET_NAME to the current GitHub repo (requires gh auth)
"
gh secret set "$SECRET_NAME" --body "$ENCODED"

echo "Done. The secret $SECRET_NAME is set."
