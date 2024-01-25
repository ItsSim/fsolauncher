#!/bin/bash

# Redirect debug output to stderr
echo "Starting timestamp.sh script..." >&2

echo "Running git log to get timestamps..." >&2
git log --format="%at" -- remeshes | head -n 1

echo "timestamp.sh script finished." >&2
