import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
    getRoom,
    startRoom,
    setRoomReady,
    leaveRoom
} from '../../services/rooms';
import { errorMessage } from '../../services/user';

export function useOnlineGame(roomId) {
    const [room, setRoom] = useState(null);
    const [game, setGame] = useState(null);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    const [busy, setBusy] = useState(false);

    const socketRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        gameRef.current = game;
    }, [game]);

    // Refresh the room while waiting for the match to start.
    useEffect(() => {
        if (!roomId) return;

        let active = true;
        let timer;

        const refresh = async () => {
            try {
                const details = await getRoom(roomId);
                if (!active) return;

                setRoom(details);

                if (details.status === 'pending') {
                    timer = setTimeout(refresh, 1500);
                } else if (details.status !== 'playing') {
                    setError(`Room status: ${details.status}`);
                }
            } catch (err) {
                if (!active) return;

                if (err.response?.status === 404) {
                    setRoom((previous) => ({
                        ...previous,
                        status: 'cancelled'
                    }));

                    setError('The room no longer exists.');
                } else {
                    setError(errorMessage(err));
                    timer = setTimeout(refresh, 1500);
                }
            }
        };

        refresh();

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [roomId]);

    // Socket.IO is only needed once the game has started.
    useEffect(() => {
        if (!roomId || room?.status !== 'playing') return;

        const socket = io('/Rooms', {
            withCredentials: true,
            autoConnect: false
        });

        socketRef.current = socket;

        socket.on('connect', async () => {
            setConnected(true);

            try {
                const ack = await socket.timeout(5000).emitWithAck(
                    'game:subscribe',
                    { gameId: roomId }
                );

                if (!ack?.ok) {
                    setError(
                        ack?.error?.code || 'Subscription failed'
                    );
                }
            } catch (err) {
                setError(err.message);
            }
        });

        socket.on('game:state', (state) => {
            setGame((previous) =>
                previous && state.version < previous.version
                    ? previous
                    : state
            );

            setError(null);
        });

        socket.on('game:cancelled', ({ gameId }) => {
            if (gameId !== roomId) return;

            setGame(null);

            setRoom((previous) => ({
                ...previous,
                status: 'cancelled'
            }));

            setError(
                'The match was cancelled because a player left.'
            );
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('connect_error', (err) => {
            setError(err.message);
        });

        socket.on('game:error', (err) => {
            setError(err?.code || 'Game error');
        });

        socket.connect();

        return () => {
            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [roomId, room?.status]);

    // Manual start (room creator only).
    const start = useCallback(async () => {
        if (!roomId || busy) return;

        setBusy(true);
        setError(null);

        try {
            await startRoom(roomId);

            setRoom((previous) => ({
                ...previous,
                status: 'playing'
            }));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }, [roomId, busy]);

    // Ready / Not ready.
    const setReady = useCallback(async (ready) => {
        if (!roomId || busy) return;

        setBusy(true);
        setError(null);

        try {
            await setRoomReady(roomId, ready);

            // Also retrieves the new room status if it auto-started.
            setRoom(await getRoom(roomId));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }, [roomId, busy]);

    // Leave pending room or active match.
    const leave = useCallback(async () => {
        if (!roomId || busy) return false;

        setBusy(true);
        setError(null);

        try {
            await leaveRoom(roomId);
            return true;
        } catch (err) {
            setError(errorMessage(err));
            return false;
        } finally {
            setBusy(false);
        }
    }, [roomId, busy]);

    // Game actions only. Round transitions are automatic.
    const act = useCallback(async (action) => {
        const socket = socketRef.current;
        const current = gameRef.current;

        if (!socket?.connected || !current || busy) return;

        setBusy(true);
        setError(null);

        try {
            const ack = await socket.timeout(5000).emitWithAck(
                'game:action',
                {
                    gameId: roomId,
                    expectedVersion: current.version,
                    action
                }
            );

            if (!ack?.ok) {
                setError(
                    ack?.error?.code || 'Action rejected'
                );
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }, [roomId, busy]);

    return {
        room,
        game,
        error,
        connected,
        busy,
        start,
        setReady,
        leave,
        act
    };
}
