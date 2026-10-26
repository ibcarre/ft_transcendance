'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { GameManager } = require('../build/src/game/GameManager.js');
const { ACTION, PHASE } = require('../build/game/index.js');

test('compiled GameManager loads and runs from CommonJS', () => {
    const manager = new GameManager(() => 0.5);
    const gameId = 'runtime-smoke-game';
    const playerId = 'runtime-smoke-alice';

    const created = manager.create({
        id: gameId,
        players: [{ id: playerId }, { id: 'runtime-smoke-bob' }],
        targetScore: 100,
    });

    assert.equal(created.ok, true);
    if (!created.ok) return;

    assert.equal(created.publicState.id, gameId);
    assert.equal(created.publicState.phase, PHASE.INITIAL_REVEAL);
    assert.equal(created.publicState.version, 0);

    const read = manager.getPublicState(gameId, playerId);
    assert.deepEqual(read, created);

    const applied = manager.submitAction(
        gameId,
        playerId,
        { type: ACTION.REVEAL_INITIAL_CARD, position: 0 },
        created.publicState.version,
    );

    assert.equal(applied.ok, true);
    if (!applied.ok) return;

    assert.equal(applied.publicState.version, 1);

    const stale = manager.submitAction(
        gameId,
        playerId,
        { type: ACTION.REVEAL_INITIAL_CARD, position: 1 },
        created.publicState.version,
    );

    assert.deepEqual(stale, {
        ok: false,
        error: { code: 'VERSION_CONFLICT' },
    });
});
