'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameManager } = require('../build/src/game/GameManager.js');
const { createGameService } = require('../src/game/gameService.js');
const initGameRooms = require('../src/socket/namespaces/gamerooms');

const GAME_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GAME2_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ALICE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const BOB = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CARL = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const DANA = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

class FakeSocket {
    constructor(userId) {
        this.user = { id: userId };
        this.rooms = new Set();
        this.handlers = new Map();
        this.events = [];
    }
    on(name, handler) { this.handlers.set(name, handler); }
    join(name) { this.rooms.add(name); }
    leave(name) { this.rooms.delete(name); }
    request(name, payload) {
        return new Promise((resolve, reject) => {
            const handler = this.handlers.get(name);
            if (!handler) return reject(new Error('Handler missing: ' + name));
            Promise.resolve(handler(payload, resolve)).catch(reject);
        });
    }
}

class FakeNamespace {
    constructor() { this.sockets = []; this.events = []; }
    on(name, handler) {
        if (name === 'connection') this.onConnection = handler;
    }
    connect(userId) {
        const socket = new FakeSocket(userId);
        this.sockets.push(socket);
        this.onConnection(socket);
        return socket;
    }
    to(room) {
        return {
            emit: (event, payload) => {
                this.events.push({ room, event, payload });
                for (const socket of this.sockets) {
                    if (socket.rooms.has(room)) {
                        socket.events.push({ event, payload });
                    }
                }
            }
        };
    }
}

function setup() {
    const manager = new GameManager(() => 0.5);
    const create = (id, users) => manager.create({
        id, players: users.map(id => ({ id }))
    });
    assert.equal(create(GAME_ID, [ALICE, BOB]).ok, true);
    assert.equal(create(GAME2_ID, [CARL, DANA]).ok, true);

    const service = createGameService({}, manager);
    const namespace = new FakeNamespace();
    initGameRooms({ of: (path) => {
        assert.equal(path, '/Rooms');
        return namespace;
    } }, service);
    return { manager, service, namespace };
}

test('subscription returns authorized snapshot and joins only the correct game room', async () => {
    const { namespace } = setup();
    const alice = namespace.connect(ALICE);
    const state = await alice.request('game:subscribe', { gameId: GAME_ID });
    assert.equal(state.ok, true);
    assert.equal(state.publicState.phase, 'INITIAL_REVEAL');
    assert.equal(state.publicState.version, 0);
    assert.deepEqual([...alice.rooms], [`game:${GAME_ID}`]);
    assert.ok(!Object.hasOwn(state.publicState, 'deck'));
});

test('nonparticipant and unknown games cannot be subscribed to', async () => {
    const { namespace } = setup();
    const outsider = namespace.connect(CARL);
    const response = await outsider.request('game:subscribe', { gameId: GAME_ID });
    assert.deepEqual(response, { ok: false, error: { code: 'GAME_UNAVAILABLE' } });
    assert.equal(outsider.rooms.size, 0);
    assert.deepEqual(await outsider.request('game:subscribe', { gameId: 'invalid' }), response);
    assert.deepEqual(await outsider.request('game:subscribe', null), response);
});

test('legal actions change the real manager and broadcast only to subscribed players', async () => {
    const { namespace, service } = setup();
    const alice = namespace.connect(ALICE);
    const bob = namespace.connect(BOB);
    const carl = namespace.connect(CARL);
    await alice.request('game:subscribe', { gameId: GAME_ID });
    await bob.request('game:subscribe', { gameId: GAME_ID });
    await carl.request('game:subscribe', { gameId: GAME2_ID });

    const result = await alice.request('game:action', {
        gameId: GAME_ID, expectedVersion: 0,
        action: { type: 'REVEAL_INITIAL_CARD', position: 0 }
    });
    assert.equal(result.ok, true);
    assert.equal(result.publicState.version, 1);
    assert.equal(namespace.events.length, 1);
    assert.equal(namespace.events[0].room, `game:${GAME_ID}`);
    assert.deepEqual(alice.events[0].payload, result.publicState);
    assert.deepEqual(bob.events[0].payload, result.publicState);
    assert.equal(carl.events.length, 0);
    assert.equal(service.getGameState(GAME_ID, BOB).publicState.version, 1);
});

test('stale version, forged identity and forbidden actions do not broadcast', async () => {
    const { namespace } = setup();
    const alice = namespace.connect(ALICE);
    await alice.request('game:subscribe', { gameId: GAME_ID });
    const valid = { gameId: GAME_ID, expectedVersion: 0,
        action: { type: 'REVEAL_INITIAL_CARD', position: 0 } };
    assert.equal((await alice.request('game:action', valid)).ok, true);
    assert.equal((await alice.request('game:action', valid)).error.code, 'VERSION_CONFLICT');
    assert.equal((await alice.request('game:action', {
        gameId: GAME_ID, expectedVersion: 1,
        action: { type: 'REVEAL_INITIAL_CARD', position: 1, playerId: BOB }
    })).error.code, 'INVALID_ACTION_PAYLOAD');
    assert.equal((await alice.request('game:action', {
        gameId: GAME_ID, expectedVersion: -1, action: { type: 'DRAW_DECK' }
    })).error.code, 'INVALID_ACTION_PAYLOAD');
    assert.equal((await alice.request('game:action', {
        gameId: GAME_ID, expectedVersion: 1, action: { type: 'DRAW_DECK' }
    })).error.code, 'ACTION_NOT_ALLOWED');
    assert.equal(namespace.events.length, 1);
});

test('nonparticipant cannot act even without subscribing', async () => {
    const { namespace } = setup();
    const outsider = namespace.connect(CARL);
    const response = await outsider.request('game:action', {
        gameId: GAME_ID, expectedVersion: 0,
        action: { type: 'REVEAL_INITIAL_CARD', position: 0 }
    });
    assert.deepEqual(response, { ok: false, error: { code: 'GAME_UNAVAILABLE' } });
    assert.equal(namespace.events.length, 0);
});

test('malformed action envelope is rejected without running the manager', async () => {
    const { namespace } = setup();
    const alice = namespace.connect(ALICE);
    for (const payload of [null, false, {}, [], {gameId: GAME_ID},
        {gameId: GAME_ID, expectedVersion: 0, action: {type: 'DRAW_DECK'}, playerId: BOB}]) {
        const response = await alice.request('game:action', payload);
        assert.deepEqual(response, { ok: false, error: { code: 'INVALID_ACTION_PAYLOAD' } });
    }
    assert.equal(namespace.events.length, 0);
});

test('second subscriber receives latest snapshot after game action', async () => {
    const { namespace } = setup();
    const alice = namespace.connect(ALICE);
    await alice.request('game:subscribe', { gameId: GAME_ID });
    await alice.request('game:action', {gameId: GAME_ID, expectedVersion: 0,
        action: {type: 'REVEAL_INITIAL_CARD', position: 0}});
    const bob = namespace.connect(BOB);
    const result = await bob.request('game:subscribe', {gameId: GAME_ID});
    assert.equal(result.publicState.version, 1);
});

test('invalid service state is not broadcast; service errors stay server-side', async () => {
    const { namespace } = setup();
    const alice = namespace.connect(ALICE);
    const badResponse = await alice.request('game:action', {
        gameId: 'not-an-uuid', expectedVersion: 0,
        action: {type: 'DRAW_DECK'}
    });
    assert.equal(badResponse.error.code, 'GAME_UNAVAILABLE');
    assert.equal(namespace.events.length, 0);
});
