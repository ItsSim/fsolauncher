#!/bin/bash

# Debug: Print the last few commits for the 'remeshes' directory to stderr
echo "Recent commits for 'remeshes':" >&2
git log -3 --pretty=format:"%h - %at - %s" -- remeshes >&2
echo "" >&2

# Get the most recent timestamp for changes in the remeshes directory
git log -1 --format="%at" -- remeshes
