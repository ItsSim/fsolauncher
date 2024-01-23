#!/bin/bash

# Get the latest timestamp from the remesh files
git log --format="%at %H" --name-only --reverse -- remeshes | awk '
  /^[0-9]+/ { timestamp=$1; next }
  { files[$0]=timestamp }
  END {
    for (file in files) {
      print files[file] " " file
    }
  }' | sort -rn | head -n 1