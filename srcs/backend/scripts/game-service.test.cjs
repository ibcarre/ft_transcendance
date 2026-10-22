'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    GameManager
} = require('../build/src/game/GameManager.js');

const {
    createGameService
} = require('../src/game/gameService.js');

const GAME_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ALICE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const BOB = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function fixture({
    roomChanges = {},
    players,
    failCommit = false,
    pause
} = {}) {
    const room = {
        id: GAME_ID,
        owner_id: ALICE,
        status: 'pending',
        goal: 100,
        nb_players: 2,
        max_players: 4,
        ...roomChanges
    };

    const participants = players ?? [
        { user_id: ALICE, seat: 0 },
        { user_id: BOB, seat: 1 }
    ];

    let commitFails = failCommit;

    const database = {
        async tx(callback) {
            const priorStatus = room.status;

            const tx = {
                async oneOrNone() {
                    if (pause) await pause;

                    return room.id ? { ...room } : null;
                },

                async any() {
                    return participants
                        .map((player) => ({ ...player }))
                        .sort((a, b) => a.seat - b.seat);
                },

                async one() {
                    room.status = 'playing';
                    return { id: GAME_ID };
                }
            };

            try {
                const result = await callback(tx);

                if (commitFails) {
                    throw new Error('simulated commit failure');
                }

                return result;

            } catch (error) {
                room.status = priorStatus;
                throw error;
            }
        },

        async any() {
            if (room.status !== 'playing') return [];

            room.status = 'cancelled';
            return [{ id: GAME_ID }];
        },

        async none() {
            if (room.status === 'playing') {
                room.status = 'cancelled';
            }
        }
    };

    return {
        service: createGameService(
            database,
            new GameManager(() => 0.5)
        ),
        room,
        setCommitFailure: (value) => {
            commitFails = value;
        }
    };
}

test('starts a game with players in seat order', async () => {
    const { service, room } = fixture({
        players: [
            { user_id: BOB, seat: 1 },
            { user_id: ALICE, seat: 0 }
        ]
    });

    const result = await service.startGame(
        GAME_ID.toUpperCase(),
        ALICE
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.publicState.version, 0);
    assert.equal(result.publicState.phase, 'INITIAL_REVEAL');

    assert.deepEqual(
        result.publicState.players.map((player) => player.id),
        [ALICE, BOB]
    );

    assert.equal(room.status, 'playing');

    assert.deepEqual(
        service.getGameState(GAME_ID, ALICE),
        result
    );

    assert.deepEqual(
        service.getGameState(GAME_ID, 'stranger'),
        {
            ok: false,
            error: { code: 'GAME_UNAVAILABLE' }
        }
    );

    assert.deepEqual(
        await service.startGame(GAME_ID, ALICE),
        {
            ok: false,
            error: { code: 'ROOM_NOT_PENDING' }
        }
    );
});

test('rejects invalid, unauthorized or unavailable rooms', async () => {
    const { service, room } = fixture();

    assert.equal(
        (await service.startGame('invalid', ALICE)).error.code,
        'INVALID_ROOM_ID'
    );

    assert.equal(
        (await service.startGame(GAME_ID, BOB)).error.code,
        'NOT_ROOM_OWNER'
    );

    room.status = 'finished';

    assert.equal(
        (await service.startGame(GAME_ID, ALICE)).error.code,
        'ROOM_NOT_PENDING'
    );

    room.id = null;

    assert.equal(
        (await service.startGame(GAME_ID, ALICE)).error.code,
        'ROOM_NOT_FOUND'
    );
});

test('rejects inconsistent SQL participants', async () => {
    const cases = [
        {
            roomChanges: { nb_players: 1 },
            players: [{ user_id: ALICE, seat: 0 }]
        },
        {
            roomChanges: { nb_players: 3 }
        },
        {
            players: [
                { user_id: ALICE, seat: 0 },
                { user_id: BOB, seat: 0 }
            ]
        },
        {
            players: [
                { user_id: ALICE, seat: 0 },
                { user_id: BOB, seat: 4 }
            ]
        },
        {
            players: [
                { user_id: BOB, seat: 1 },
                { user_id: BOB, seat: 2 }
            ]
        }
    ];

    for (const options of cases) {
        const { service, room } = fixture(options);

        const result = await service.startGame(GAME_ID, ALICE);

        assert.equal(result.ok, false);
        assert.equal(result.error.code, 'ROOM_STATE_INVALID');
        assert.equal(room.status, 'pending');

        assert.equal(
            service.getGameState(GAME_ID, ALICE).ok,
            false
        );
    }
});

test('cleans up when the database commit fails', async () => {
    const { service, room, setCommitFailure } = fixture({
        failCommit: true
    });

    await assert.rejects(
        service.startGame(GAME_ID, ALICE),
        /simulated commit failure/
    );

    assert.equal(room.status, 'pending');

    assert.equal(
        service.getGameState(GAME_ID, ALICE).ok,
        false
    );

    setCommitFailure(false);

    assert.equal(
        (await service.startGame(GAME_ID, ALICE)).ok,
        true
    );
});

test('rejects concurrent starts during initialization', async () => {
    let release;

    const pause = new Promise((resolve) => {
        release = resolve;
    });

    const { service } = fixture({ pause });

    const first = service.startGame(GAME_ID, ALICE);
    const second = await service.startGame(GAME_ID, ALICE);

    assert.equal(second.ok, false);
    assert.equal(second.error.code, 'START_IN_PROGRESS');

    assert.equal(
        service.getGameState(GAME_ID, ALICE).ok,
        false
    );

    release();

    assert.equal((await first).ok, true);
});

test('cancels interrupted games after restart', async () => {
    const { service, room } = fixture({
        roomChanges: { status: 'playing' }
    });

    assert.equal(
        await service.reconcileInterruptedGames(),
        1
    );

    assert.equal(room.status, 'cancelled');

    assert.equal(
        await service.reconcileInterruptedGames(),
        0
    );
});


test('submitGameAction uses authenticated actor, version and input validation', async () => {
    const { service } = fixture();

    const created = await service.startGame(GAME_ID, ALICE);
    assert.equal(created.ok, true);

    const wrongActor = service.submitGameAction(
        GAME_ID,
        'outsider',
        { type: 'REVEAL_INITIAL_CARD', position: 0 },
        0
    );

    assert.deepEqual(wrongActor, {
        ok: false,
        error: { code: 'GAME_UNAVAILABLE' }
    });

    const first = service.submitGameAction(
        GAME_ID,
        ALICE,
        { type: 'REVEAL_INITIAL_CARD', position: 0 },
        0
    );

    assert.equal(first.ok, true);
    assert.equal(first.publicState.version, 1);

    assert.equal(
        service.submitGameAction(
            GAME_ID,
            ALICE,
            { type: 'REVEAL_INITIAL_CARD', position: 1 },
            0
        ).error.code,
        'VERSION_CONFLICT'
    );

    assert.equal(
        service.submitGameAction(
            GAME_ID,
            ALICE,
            {
                type: 'REVEAL_INITIAL_CARD',
                position: 1,
                playerId: BOB
            },
            1
        ).error.code,
        'INVALID_ACTION_PAYLOAD'
    );

    assert.equal(
        service.getGameState(GAME_ID, ALICE).publicState.version,
        1
    );
});
