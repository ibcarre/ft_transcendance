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

run_test "board / column resolution tests" \
	"game/test/board.test.ts"

run_test "turn order / round-finisher helpers tests" \
	"game/test/turn.test.ts"

run_test "createGame() tests" \
	"game/test/createGame.test.ts"

run_test "buildPublicState() tests" \
	"game/test/publicState.test.ts"

run_test "REVEAL_INITIAL_CARD tests" \
	"game/test/revealInitialCard.test.ts"

run_test "DRAW_DECK and DRAW_DISCARD tests" \
	"game/test/drawCard.test.ts"

run_test "SWAP_CARD tests" \
	"game/test/swapCard.test.ts"

run_test "DISCARD_DRAWN_CARD tests" \
	"game/test/discardDrawnCard.test.ts"

run_test "REVEAL_CARD tests" \
	"game/test/revealCard.test.ts"

printf '\n'
printf '============================================================\n'
printf '  All Game Engine tests passed\n'
printf '============================================================\n\n'
