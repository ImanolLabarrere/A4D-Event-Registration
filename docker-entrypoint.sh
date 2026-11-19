#!/bin/sh
set -e

# Container entrypoint: transfers execution to CMD via exec,
# ensuring the Node process runs as PID 1 to handle SIGTERM gracefully.
exec "$@"
