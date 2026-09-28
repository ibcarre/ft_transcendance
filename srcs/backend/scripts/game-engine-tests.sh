#!/usr/bin/env bash

set -e

run_test()
{
	local name="$1"
	local file="$2"

	printf '\n'
	printf '============================================================\n'
	printf '  %s\n' "$name"
	printf '============================================================\n\n'

	tsx --test "$file"
}

run_test "createDeck() tests" \
	"game/test/createDeck.test.ts"

run_test "shuffleDeck() tests" \
	"game/test/shuffleDeck.test.ts"

run_test "takeTopCard() tests" \
	"game/test/takeTopCard.test.ts"

run_test "createGame() tests" \
	"game/test/createGame.test.ts"

printf '\n'
printf '============================================================\n'
printf '  All Game Engine tests passed\n'
printf '============================================================\n\n'
