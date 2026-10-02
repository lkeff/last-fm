#!/bin/sh
set -e
# Mounted volumes (e.g. fly.io) are owned by root; hand the store directory to the node user.
STORE_DIR=$(dirname "${COUNTDOWN_STORE_PATH:-/app/data/countdowns.json}")
mkdir -p "$STORE_DIR"
chown node:node "$STORE_DIR"
exec setpriv --reuid=node --regid=node --init-groups "$@"
