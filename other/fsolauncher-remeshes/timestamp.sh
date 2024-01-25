#!/bin/bash

# Redirect debug output to stderr
echo "Starting timestamp.sh script..." >&2

echo "Running git log to get timestamps..." >&2
git log --format="%at %H" --name-only --reverse -- remeshes | awk '
  /^[0-9]+/ {
    timestamp=$1;
    next
  }
  {
    files[$0]=timestamp
  }
  END {
    for (file in files) {
      print files[file] " " file
    }
  }' | sort -rn | head -n 1

echo "timestamp.sh script finished." >&2
