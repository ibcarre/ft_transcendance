/**
 * End-to-end integration test for ft_transcendence (HTTP + Socket.IO).
 *
 * Run with Node.js >=22 after `npm ci`.
 *
 * Usage:
 *   node skyjo-integration-test.mjs
 *
 * Optional:
 *   SKYJO_URL=https://localhost:44443 node skyjo-integration-test.mjs
 *
 */

import https from 'node:https';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const base = process.env.SKYJO_URL || 'https://localhost:44443';

if (
    !base.startsWith('https://localhost:') &&
    !base.startsWith('https://127.0.0.1:')
) {
    throw new Error(
        'This test intentionally accepts only local HTTPS endpoints.'
    );
}

const agent = new https.Agent({
    rejectUnauthorized: false // Local self-signed certificate ONLY
});

const userPassword = 'Test-42!Aa';
const roomPassword = 'Room-42!Aa';

const unique = randomBytes(5).toString('hex');
const roomName = `e2e-${unique}`;

const users = [
    {
        name: `testa${unique}`,
        email: `testa${unique}@example.com`
    },
    {
        name: `testb${unique}`,
        email: `testb${unique}@example.com`
    }
];

const sockets = [];

// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------

function api(method, path, { fields, cookie } = {}) {
    return new Promise((resolve, reject) => {
        const form = fields
            ? new URLSearchParams(fields).toString()
            : '';

        const url = new URL(`/api${path}`, base);
        const headers = {};

        if (fields) {
            headers['Content-Type'] =
                'application/x-www-form-urlencoded';

            headers['Content-Length'] =
                Buffer.byteLength(form);
        }

        if (cookie) {
            headers.Cookie = cookie;
        }

        const request = https.request(
            url,
            {
                method,
                agent,
                headers,
                timeout: 10000
            },
            (response) => {
                let body = '';

                response.setEncoding('utf8');

                response.on('data', (chunk) => {
                    body += chunk;
                });

                response.on('end', () => {
                    let data;

                    try {
                        data = JSON.parse(body);
                    } catch {
                        data = body.trim();
                    }

                    resolve({
                        status: response.statusCode,
                        headers: response.headers,
                        data
                    });
                });
            }
        );

        request.on('timeout', () => {
            request.destroy(
                new Error(`HTTP timeout: ${method} ${path}`)
            );
        });

        request.on('error', reject);
        request.end(form);
    });
}

async function expectHttp(method, path, options, status) {
    const result = await api(method, path, options);

    if (result.status !== status) {
        throw new Error(
            `${method} ${path}: HTTP ${result.status}, ` +
            `expected ${status}; ` +
            `body=${JSON.stringify(result.data)}`
        );
    }

    return result;
}

// ------------------------------------------------------------
// JWT helpers
// ------------------------------------------------------------

function extractJwt(result) {
    const cookies = result.headers['set-cookie'] || [];

    const raw = cookies.find((value) =>
        value.startsWith('access_token=')
    );

    const token = raw?.match(/^access_token=([^;]+)/)?.[1];

    if (!token) {
        throw new Error('No access_token in Set-Cookie.');
    }

    return token;
}

function getUserId(token) {
    // JWT decode for diagnostics only.
    // Authorization is always performed by the backend.

    const payload = JSON.parse(
        Buffer.from(
            token.split('.')[1],
            'base64url'
        ).toString('utf8')
    );

    if (typeof payload.userId !== 'string') {
        throw new Error('JWT has no userId');
    }

    return payload.userId;
}

// ------------------------------------------------------------
// Socket.IO helpers
// ------------------------------------------------------------

function connectPlayer(user, gameId) {
    const socket = io(`${base}/Rooms`, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 10000,

        extraHeaders: {
            Cookie: `access_token=${user.token}`
        },

        rejectUnauthorized: false // Local certificate ONLY
    });

    sockets.push(socket);
    user.states = [];

    socket.on('game:state', (state) => {
        user.states.push(state);

        console.log(
            `   [${user.name}] game:state ` +
            `phase=${state.phase} version=${state.version}`
        );
    });

    socket.on('game:error', (error) => {
        console.error(
            `   [${user.name}] game:error`,
            error
        );
    });

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(
                new Error(
                    `Socket connection timeout: ${user.name}`
                )
            );
        }, 10000);

        socket.once('connect', () => {
            clearTimeout(timer);
            resolve(socket);
        });

        socket.once('connect_error', (error) => {
            clearTimeout(timer);

            reject(
                new Error(`${user.name}: ${error.message}`)
            );
        });
    });
}

async function emitAck(socket, name, payload) {
    const result = await socket
        .timeout(8000)
        .emitWithAck(name, payload);

    if (!result?.ok) {
        throw new Error(
            `${name}: ${JSON.stringify(result)}`
        );
    }

    return result;
}

function waitForVersion(user, version, timeout = 8000) {
    if (user.states.some((s) => s.version >= version)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const socket = user.socket;

        const timer = setTimeout(() => {
            socket.off('game:state', check);

            reject(
                new Error(
                    `${user.name}: missing game:state version ${version}`
                )
            );
        }, timeout);

        const check = (state) => {
            if (state.version >= version) {
                clearTimeout(timer);
                socket.off('game:state', check);
                resolve();
            }
        };

        socket.on('game:state', check);
    });
}

// ------------------------------------------------------------
// Main integration test
// ------------------------------------------------------------

try {
    console.log(`Target: ${base}`);

    // --------------------------------------------------------
    // 1. Create and authenticate two users
    // --------------------------------------------------------

    console.log('1) Register and login two distinct users');

    for (const user of users) {
        await expectHttp(
            'POST',
            '/user/signup',
            {
                fields: {
                    username: user.name,
                    email: user.email,
                    password: userPassword
                }
            },
            201
        );

        const login = await expectHttp(
            'POST',
            '/user/login',
            {
                fields: {
                    email: user.email,
                    password: userPassword
                }
            },
            200
        );

        user.token = extractJwt(login);
        user.id = getUserId(user.token);

        console.log(
            `   ${user.name} -> ${user.id} ` +
            '(JWT extracted, not displayed)'
        );
    }

    // --------------------------------------------------------
    // 2. Create private room
    // --------------------------------------------------------

    console.log('2) Create a PRIVATE room by player A');

    const created = await expectHttp(
        'POST',
        '/rooms/createRoom',
        {
            cookie: `access_token=${users[0].token}`,

            fields: {
                name: roomName,
                password: roomPassword,
                max_players: '2'
            }
        },
        201
    );

    const gameId = String(created.data).replace(/^"|"$/g, '');

    assert.match(
        gameId,
        /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i
    );

    console.log(`   Room: ${gameId}`);

    // --------------------------------------------------------
    // 3. Player B joins
    // --------------------------------------------------------

    console.log('3) Join private room as player B');

    await expectHttp(
        'POST',
        `/rooms/joinRoom/${gameId}`,
        {
            cookie: `access_token=${users[1].token}`,

            fields: {
                password: roomPassword
            }
        },
        201
    );

    // --------------------------------------------------------
    // 4. Start game from HTTP controller
    // --------------------------------------------------------

    console.log(
        '4) Start game as room creator ' +
        '(MUST happen before socket subscription)'
    );

    const started = await expectHttp(
        'POST',
        `/rooms/${gameId}/start`,
        {
            cookie: `access_token=${users[0].token}`
        },
        200
    );

    assert.equal(started.data.gameId, gameId);

    assert.equal(
        started.data.publicState?.id,
        gameId
    );

    assert.equal(
        started.data.publicState.players.length,
        2
    );

    const initialVersion = started.data.publicState.version;

    console.log(
        '   GameManager created: ' +
        `phase=${started.data.publicState.phase}, ` +
        `version=${initialVersion}`
    );

    assert.equal(
        started.data.publicState.phase,
        'INITIAL_REVEAL'
    );

    assert(
        started.data.publicState.players.some(
            (p) => p.id === users[0].id
        )
    );

    assert(
        started.data.publicState.players.some(
            (p) => p.id === users[1].id
        )
    );

    // --------------------------------------------------------
    // 5. Connect both players through Socket.IO
    // --------------------------------------------------------

    console.log(
        '5) Connect both players over Socket.IO and subscribe'
    );

    for (const user of users) {
        user.socket = await connectPlayer(user, gameId);

        await emitAck(
            user.socket,
            'game:subscribe',
            { gameId }
        );

        await waitForVersion(user, initialVersion);

        assert.equal(
            user.states.at(-1).id,
            gameId
        );

        console.log(`   Subscribed: ${user.name}`);
    }

    // --------------------------------------------------------
    // 6. Send an action and verify broadcast
    // --------------------------------------------------------

    console.log(
        '6) Player A reveals card 0 ' +
        '(both players must receive updated state)'
    );

    const newVersion = initialVersion + 1;

    const aReceived = waitForVersion(
        users[0],
        newVersion
    );

    const bReceived = waitForVersion(
        users[1],
        newVersion
    );

    await emitAck(
        users[0].socket,
        'game:action',
        {
            gameId,

            action: {
                type: 'REVEAL_INITIAL_CARD',
                position: 0
            },

            expectedVersion: initialVersion
        }
    );

    await Promise.all([
        aReceived,
        bReceived
    ]);

    const aLatest = users[0].states.at(-1);
    const bLatest = users[1].states.at(-1);

    assert.equal(
        aLatest.version,
        newVersion
    );

    assert.equal(
        bLatest.version,
        newVersion
    );

    assert.equal(
        aLatest.players.find(
            (p) => p.id === users[0].id
        ).board[0].status,
        'revealed'
    );

    assert.equal(
        bLatest.players.find(
            (p) => p.id === users[0].id
        ).board[0].status,
        'revealed'
    );

    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    console.log(
        '\nPASS: signup, login, create, join, start, ' +
        'subscribe x2, action + broadcast x2'
    );

    console.log(`Room/game ID: ${gameId}`);

    console.log(
        'No browser, manual JWT, or manual PostgreSQL ' +
        'changes were used.'
    );

} catch (error) {
    console.error('\nFAIL:', error.message);
    process.exitCode = 1;

} finally {
    for (const socket of sockets) {
        socket.disconnect();
    }

    agent.destroy();
}
