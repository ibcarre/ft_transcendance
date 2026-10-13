#!/usr/bin/env bash

set -euo pipefail

green=$'\033[32m'
red=$'\033[31m'
cyan=$'\033[36m'
bold=$'\033[1m'
reset=$'\033[0m'

printf '%s%-32s  %-24s  %s%s\n' \
  "$bold" "NAMES" "STATUS" "PORTS" "$reset"

docker ps -a "$@" --format $'{{.Image}}\t{{.Names}}\t{{.State}}\t{{.Status}}\t{{.Ports}}' |
while IFS=$'\t' read -r image name state status ports; do
  if [[ $state == running ]]; then
    mark="${green}✅${reset}"
    sc=$green
  else
    mark="${red}❌${reset}"
    sc=$red
  fi
  printf '%s %s%-24s%s  %s%-32s%s  %s\n' \
    "$mark"\
    "$cyan" "$name" "$reset" \
    "$sc" "$status" "$reset" \
    "$ports"
done
