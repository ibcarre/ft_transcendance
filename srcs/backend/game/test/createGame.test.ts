import test from "node:test";
import assert from "node:assert/strict";

import {
    createGame,
} from "../index";


test("createGame creates one 12-card board per player", () => {
        const game =
            createGame({
                id: "game-test",
                players: [
                    { id: "alice" },
                    { id: "bob" },
                ],
            });

        assert.equal(game.players.length, 2);
        assert.equal(game.players[0]?.board.length, 12);
        assert.equal(game.players[1]?.board.length, 12);
    }
);
