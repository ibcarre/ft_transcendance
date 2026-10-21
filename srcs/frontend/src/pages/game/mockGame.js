// MOCKUP : logique de partie simplifiée et locale pour tester l'UX de la page game.
// A remplacer par le PublicGameState envoyé par le back (backend/game/publicState.ts).
// Les statuts de carte reprennent PublicBoardCard : 'hidden' | 'revealed' | 'removed'.
// Plateau de 12 cartes, rangé ligne par ligne : la colonne d'une position = position % 4.

export const ME_ID = 'me';
export const BOARD_COLUMNS = 4;
export const TARGET_SCORE = 100;

const shuffle = (cards) => {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// 150 cartes : 5 x -2, 10 x -1, 15 x 0, 10 x chaque valeur de 1 à 12
const buildDeck = () => {
    const cards = [];
    const add = (value, count) => {
        for (let i = 0; i < count; i++) cards.push(value);
    };
    add(-2, 5);
    add(-1, 10);
    add(0, 15);
    for (let value = 1; value <= 12; value++) add(value, 10);
    return shuffle(cards);
};

const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

const positionsWith = (board, status) =>
    board.flatMap((slot, pos) => (slot.status === status ? [pos] : []));

export const visibleScore = (board) =>
    board.reduce((sum, slot) => (slot.status === 'revealed' ? sum + slot.value : sum), 0);

const currentPlayer = (state) => state.players.find((p) => p.id === state.currentPlayerId);

// Trois cartes identiques visibles dans une colonne : la colonne part à la défausse
const removeColumnIfComplete = (state, player, position) => {
    const column = position % BOARD_COLUMNS;
    const slots = [column, column + BOARD_COLUMNS, column + BOARD_COLUMNS * 2].map((pos) => player.board[pos]);
    const complete = slots.every((slot) => slot.status === 'revealed' && slot.value === slots[0].value);
    if (!complete) return;
    slots.forEach((slot) => {
        state.discard.push(slot.value);
        slot.status = 'removed';
    });
};

const createRound = (players, roundNumber) => {
    const deck = buildDeck();
    return {
        players: players.map((player) => ({
            ...player,
            board: deck.splice(0, 12).map((value) => ({ value, status: 'hidden' })),
        })),
        deck,
        discard: [deck.pop()],
        pendingCard: null,
        roundNumber,
        roundFinisherId: null,
        lastRound: null,
        winnerIds: [],
        targetScore: TARGET_SCORE,
    };
};

export function createMockGame({ myName, nbPlayers }) {
    const players = Array.from({ length: nbPlayers }, (_, i) => ({
        id: i === 0 ? ME_ID : `p${i + 1}`,
        name: i === 0 ? myName : `Player ${i + 1}`,
        totalScore: 0,
    }));

    const state = {
        ...createRound(players, 1),
        phase: 'INITIAL_REVEAL',
        turnStage: null,
        currentPlayerId: null,
    };

    // Les adversaires ont déjà révélé leurs 2 cartes
    state.players
        .filter((p) => p.id !== ME_ID)
        .forEach((p) => {
            shuffle(positionsWith(p.board, 'hidden'))
                .slice(0, 2)
                .forEach((pos) => (p.board[pos].status = 'revealed'));
        });

    return state;
}

// Le joueur dont la somme des 2 cartes révélées est la plus haute commence
const startFirstRound = (state) => {
    const sums = state.players.map((p) => visibleScore(p.board));
    const best = Math.max(...sums);
    const starters = state.players.filter((_, i) => sums[i] === best);
    state.phase = 'PLAYING';
    state.turnStage = 'WAITING_FOR_DRAW';
    state.currentPlayerId = randomItem(starters).id;
};

const finishRound = (state) => {
    state.players.forEach((player) => {
        player.board.forEach((slot) => {
            if (slot.status === 'hidden') slot.status = 'revealed';
        });
        for (let column = 0; column < BOARD_COLUMNS; column++) removeColumnIfComplete(state, player, column);
    });

    const scores = state.players.map((player) => ({ playerId: player.id, baseScore: visibleScore(player.board) }));
    const finisher = scores.find((s) => s.playerId === state.roundFinisherId);
    const beaten = scores.some((s) => s.playerId !== finisher.playerId && s.baseScore <= finisher.baseScore);

    scores.forEach((s) => {
        const doubled = s === finisher && beaten && s.baseScore > 0;
        s.finalScore = doubled ? s.baseScore * 2 : s.baseScore;
        state.players.find((p) => p.id === s.playerId).totalScore += s.finalScore;
    });

    state.lastRound = { roundNumber: state.roundNumber, finisherId: state.roundFinisherId, scores };
    state.turnStage = null;
    state.pendingCard = null;

    if (state.players.some((p) => p.totalScore >= state.targetScore)) {
        const best = Math.min(...state.players.map((p) => p.totalScore));
        state.winnerIds = state.players.filter((p) => p.totalScore === best).map((p) => p.id);
        state.phase = 'GAME_OVER';
    } else {
        state.phase = 'ROUND_FINISHED';
    }
};

const endTurn = (state) => {
    const player = currentPlayer(state);
    if (!state.roundFinisherId && positionsWith(player.board, 'hidden').length === 0) {
        state.roundFinisherId = player.id;
    }

    const index = state.players.indexOf(player);
    const next = state.players[(index + 1) % state.players.length];

    if (state.roundFinisherId && next.id === state.roundFinisherId) {
        finishRound(state);
        return;
    }
    state.currentPlayerId = next.id;
    state.turnStage = 'WAITING_FOR_DRAW';
};

const drawDeck = (state) => {
    if (state.deck.length === 0) {
        const top = state.discard.pop();
        state.deck = shuffle(state.discard);
        state.discard = [top];
    }
    state.pendingCard = { source: 'DECK', value: state.deck.pop() };
    state.turnStage = 'DRAWN_FROM_DECK';
};

const drawDiscard = (state) => {
    state.pendingCard = { source: 'DISCARD', value: state.discard.pop() };
    state.turnStage = 'MUST_SWAP_DISCARD';
};

const swapCard = (state, position) => {
    const player = currentPlayer(state);
    const slot = player.board[position];
    state.discard.push(slot.value);
    player.board[position] = { value: state.pendingCard.value, status: 'revealed' };
    state.pendingCard = null;
    removeColumnIfComplete(state, player, position);
    endTurn(state);
};

const discardDrawnCard = (state) => {
    state.discard.push(state.pendingCard.value);
    state.pendingCard = null;
    state.turnStage = 'MUST_REVEAL_CARD';
};

const revealCard = (state, position) => {
    const player = currentPlayer(state);
    player.board[position].status = 'revealed';
    removeColumnIfComplete(state, player, position);
    endTurn(state);
};

// Adversaire très simple : garde les petites cartes, remplace sa plus grosse carte visible
const botTurn = (state) => {
    const player = currentPlayer(state);
    const hidden = positionsWith(player.board, 'hidden');
    const playable = player.board.flatMap((slot, pos) => (slot.status !== 'removed' ? [pos] : []));
    const revealed = positionsWith(player.board, 'revealed');
    const worst = revealed.reduce((a, b) => (player.board[b].value > player.board[a].value ? b : a), revealed[0]);

    const targetFor = (value) => {
        if (worst !== undefined && player.board[worst].value > value) return worst;
        if (hidden.length > 0) return randomItem(hidden);
        return randomItem(playable);
    };

    const top = state.discard.at(-1);
    if (top <= 3) {
        drawDiscard(state);
        swapCard(state, targetFor(top));
        return;
    }

    drawDeck(state);
    const value = state.pendingCard.value;
    if (value <= 4 || hidden.length === 0) {
        swapCard(state, targetFor(value));
    } else {
        discardDrawnCard(state);
        revealCard(state, randomItem(hidden));
    }
};

export function gameReducer(previous, action) {
    const state = structuredClone(previous);

    switch (action.type) {
        case 'REVEAL_INITIAL_CARD': {
            const me = state.players.find((p) => p.id === ME_ID);
            me.board[action.position].status = 'revealed';
            if (positionsWith(me.board, 'revealed').length === 2) startFirstRound(state);
            return state;
        }
        case 'DRAW_DECK':
            drawDeck(state);
            return state;
        case 'DRAW_DISCARD':
            drawDiscard(state);
            return state;
        case 'SWAP_CARD':
            swapCard(state, action.position);
            return state;
        case 'DISCARD_DRAWN_CARD':
            discardDrawnCard(state);
            return state;
        case 'REVEAL_CARD':
            revealCard(state, action.position);
            return state;
        case 'BOT_TURN':
            botTurn(state);
            return state;
        case 'NEXT_ROUND': {
            // Manches suivantes : toutes les cartes cachées, le finisseur commence
            const next = createRound(state.players, state.roundNumber + 1);
            return {
                ...next,
                phase: 'PLAYING',
                turnStage: 'WAITING_FOR_DRAW',
                currentPlayerId: state.lastRound.finisherId,
            };
        }
        case 'RESTART':
            return createMockGame({ myName: action.myName, nbPlayers: state.players.length });
        default:
            return previous;
    }
}
