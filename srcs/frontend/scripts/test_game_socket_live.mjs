// Black-box test through Nginx + real Socket.IO and PostgreSQL.
// Run ONLY against the disposable local/CI stack.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { io } from 'socket.io-client';

const base = process.env.BASE_URL ?? 'https://nginx';
if (!['https://nginx', 'https://localhost'].includes(base)
	&& !/^https:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(base)) {
	throw new Error('Only the disposable local/CI stack may be tested');
}

const suffix = randomUUID().slice(0, 8);
const password = 'Skyjo!Pass1234';
const users = [
	{ username: `SocketA${suffix}`, email: `socket.a.${suffix}@example.com` },
	{ username: `SocketB${suffix}`, email: `socket.b.${suffix}@example.com` },
	{ username: `SocketC${suffix}`, email: `socket.c.${suffix}@example.com` },
];
const clients = [];
let checks = 0;

function check(label, condition) {
	assert.ok(condition, label);
	checks++;
	console.log(`PASS: ${label}`);
}

async function request(path, method, cookie, data) {
	const headers = {};
	if (cookie) headers.cookie = cookie;
	if (data !== undefined) headers['content-type'] = 'application/json';
	const response = await fetch(`${base}${path}`, {
		method,
		headers,
		body: data === undefined ? undefined : JSON.stringify(data),
		signal: AbortSignal.timeout(7000),
	});
	const body = await response.text();
	return {
		status: response.status,
		body,
		json: () => JSON.parse(body),
		cookie: response.headers.get('set-cookie')?.split(';')[0],
	};
}

async function connect(cookie) {
	const socket = io(`${base}/Rooms`, {
		transports: ['websocket'],
		extraHeaders: cookie ? { cookie } : {},
		rejectUnauthorized: false,
		reconnection: false,
		timeout: 5000,
	});
	clients.push(socket);
	return await new Promise((resolve, reject) => {
		socket.once('connect', () => resolve(socket));
		socket.once('connect_error', reject);
	});
}

const ack = (socket, event, payload) =>
	socket.timeout(5000).emitWithAck(event, payload);


function waitForVersion(socket, version) {
	return new Promise((resolve, reject) => {
		function onState(state) {
			if (state.version !== version) return;

			clearTimeout(timer);
			socket.off('game:state', onState);
			resolve(state);
		}

		const timer = setTimeout(() => {
			socket.off('game:state', onState);
			reject(new Error(
				`Missing game:state version ${version}`
			));
		}, 3000);

		socket.on('game:state', onState);
	});
}

try {
	const probe = await request('/api/rooms/not-an-id/start', 'POST');
	check('HTTP API is reachable and authenticated', probe.status === 401);

	await assert.rejects(connect(), /unauthorized/);
	check('Socket.IO rejects a missing cookie', true);

	await assert.rejects(
		connect('access_token=invalid.jwt.token'),
		/unauthorized/
	);
	check('Socket.IO rejects an invalid JWT', true);

	for (const user of users) {
		const signup = await request('/api/user/signup', 'POST', null, {
			...user, password,
		});
		check(`signup ${user.username}`, signup.status === 201 && !!signup.cookie);
		user.cookie = signup.cookie;
		const profile = await request('/api/user/profile', 'GET', user.cookie);
		check(`profile ${user.username}`, profile.status === 200);
		user.id = profile.json().id;
	}

	const create = await request('/api/rooms/createRoom', 'POST', users[0].cookie, {
		name: `Socket${suffix}`,
		max_players: 2,
		password: 'SocketRoom!2026',
	});
	check('room created', create.status === 201);
	const gameId = create.body.replaceAll('"', '').trim();
	check('room has UUID', /^[0-9a-f-]{36}$/i.test(gameId));

	const join = await request(`/api/rooms/joinRoom/${gameId}`, 'POST', users[1].cookie, {
		password: 'SocketRoom!2026',
	});
	check('second user joined', join.status === 201);

	const start = await request(`/api/rooms/${gameId}/start`, 'POST', users[0].cookie, {});
	check('GameManager started', start.status === 201 && start.json().ok === true);
	check('initial game version', start.json().publicState.version === 0);

	const [alice, bob, outsider] = await Promise.all(
		users.map(user => connect(user.cookie))
	);
	check('three authenticated Socket.IO connections', [alice, bob, outsider].every(s => s.connected));

	const outsiderReply = await ack(outsider, 'game:subscribe', { gameId });
	check('outsider subscription rejected', !outsiderReply.ok && outsiderReply.error.code === 'GAME_UNAVAILABLE');

	const outsiderAction = await ack(outsider, 'game:action', {
		gameId, expectedVersion: 0,
		action: { type: 'REVEAL_INITIAL_CARD', position: 0 },
	});
	check('outsider command rejected', !outsiderAction.ok && outsiderAction.error.code === 'GAME_UNAVAILABLE');

	const [aliceStart, bobStart] = await Promise.all([
		ack(alice, 'game:subscribe', { gameId }),
		ack(bob, 'game:subscribe', { gameId }),
	]);
	check('participants subscribed', aliceStart.ok && bobStart.ok);
	check('same initial snapshot', aliceStart.publicState.version === 0 && bobStart.publicState.version === 0);
	check('private deck not exposed', !('deck' in aliceStart.publicState));
	check('cards hidden', aliceStart.publicState.players.every(p =>
		p.board.length === 12 && p.board.every(c => c.status === 'hidden' && !('value' in c))
	));

	const received = { alice: [], bob: [], outsider: [] };
	alice.on('game:state', state => received.alice.push(state));
	bob.on('game:state', state => received.bob.push(state));
	outsider.on('game:state', state => received.outsider.push(state));


	async function play(actor, version, action) {
		const aliceState = waitForVersion(alice, version + 1);
		const bobState = waitForVersion(bob, version + 1);

		const [reply, seenByAlice, seenByBob] = await Promise.all([
			ack(actor, 'game:action', {
				gameId,
				expectedVersion: version,
				action
			}),
			aliceState,
			bobState
		]);

		check(`accepted action and broadcasts at version ${version + 1}`,
			reply.ok
			&& reply.publicState.version === version + 1
			&& seenByAlice.version === version + 1
			&& seenByBob.version === version + 1
		);

		return reply.publicState;
	}


	const first = await play(alice, 0, {
		type: 'REVEAL_INITIAL_CARD',
		position: 0
	});

	check('Alice action accepted', first.version === 1);

	check('Alice receives broadcast',
		received.alice.length === 1
		&& received.alice[0].version === 1
	);

	check('Bob receives broadcast',
		received.bob.length === 1
		&& received.bob[0].version === 1
	);

	check('outsider receives no state',
		received.outsider.length === 0
	);

	const stale = await ack(alice, 'game:action', {
		gameId, expectedVersion: 0,
		action: { type: 'REVEAL_INITIAL_CARD', position: 1 },
	});
	check('stale version rejected', !stale.ok && stale.error.code === 'VERSION_CONFLICT');
	await delay(100);
	check('rejected command not broadcast', received.bob.length === 1);

	const forged = await ack(alice, 'game:action', {
		gameId, expectedVersion: 1,
		action: { type: 'REVEAL_INITIAL_CARD', position: 1, playerId: users[1].id },
	});
	check('forged player identity rejected', !forged.ok && forged.error.code === 'INVALID_ACTION_PAYLOAD');

	const second = await play(bob, 1, {
		type: 'REVEAL_INITIAL_CARD',
		position: 0
	});

	check('Bob action accepted', second.version === 2);

	check('both clients synchronized',
		received.alice.at(-1)?.version === 2
		&& received.bob.at(-1)?.version === 2
	);

	const again = await ack(bob, 'game:subscribe', { gameId });
	check('resubscribe gets latest version', again.ok && again.publicState.version === 2);


	// Complete both players' initial reveal.
	await play(alice, 2, {
		type: 'REVEAL_INITIAL_CARD',
		position: 1
	});

	let state = await play(bob, 3, {
		type: 'REVEAL_INITIAL_CARD',
		position: 1
	});

	check('game entered PLAYING',
		state.phase === 'PLAYING'
		&& state.turnStage === 'WAITING_FOR_DRAW'
	);

	// The engine decides who starts, not the test.
	const firstPlayerId = state.currentPlayerId;

	check('current player is an actual participant',
		[users[0].id, users[1].id].includes(firstPlayerId)
	);

	const currentSocket =
		firstPlayerId === users[0].id ? alice : bob;

	// Draw from the deck.
	state = await play(currentSocket, 4, {
		type: 'DRAW_DECK'
	});

	check('draw moves to DRAWN_FROM_DECK',
		state.phase === 'PLAYING'
		&& state.turnStage === 'DRAWN_FROM_DECK'
	);

	// Swap a card to complete the turn.
	state = await play(currentSocket, 5, {
		type: 'SWAP_CARD',
		position: 2
	});

	check('swap ends the turn and switches players',
		state.turnStage === 'WAITING_FOR_DRAW'
		&& state.currentPlayerId !== firstPlayerId
	);

	check('outsider still has no state',
		received.outsider.length === 0
	);


	console.log(`\nSUCCESS: ${checks} real HTTP/Socket.IO checks passed. Game: ${gameId}`);
} finally {
	for (const socket of clients) socket.disconnect();
}
