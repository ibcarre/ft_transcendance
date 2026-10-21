# Skyjo — Guide développeur du Game Engine et du GameManager

> **Objectif :** ce document décrit les interfaces disponibles, les données échangées, les règles appliquées et les erreurs à gérer.
>
> **Périmètre :** `srcs/backend/game/` (moteur) et `srcs/backend/src/game/GameManager.ts` (gestion des parties). Les chemins ci-dessous sont relatifs à `srcs/backend/`.

## TL;DR — l'essentiel en une minute

- **Utiliser `GameManager` pour les interactions avec les joueurs.** Il conserve les parties en mémoire, contrôle leur appartenance, valide les commandes et les versions, puis renvoie un état public.
- **Ne jamais transmettre `GameState` à un client.** Les réponses du manager contiennent `PublicGameState`, qui masque les cartes cachées et le contenu de la pioche.
- **Six commandes** existent : `REVEAL_INITIAL_CARD`, `DRAW_DECK`, `DRAW_DISCARD`, `SWAP_CARD`, `DISCARD_DRAWN_CARD`, `REVEAL_CARD`. Les actions avec une case utilisent une position **de `0` à `11`**.
- **Une commande réussie = `version + 1`.** Fournir la version courante à `submitAction()` ; réutiliser celle de chaque nouvel état reçu. Les erreurs ne changent pas la partie enregistrée.
- **Identité :** `userId` vient du serveur (utilisateur authentifié), **jamais du JSON de la commande**. Le manager ajoute lui-même `playerId`.
- **Fin de manche :** lorsque l'état passe à `ROUND_FINISHED`, le serveur peut appeler `advanceRound()` avec la version courante. `GAME_OVER` est terminal.
- **Retours habituels :** `{ ok: true, publicState }` ou `{ ok: false, error: { code } }`. **Exception :** des entrées de création invalides et des incohérences internes peuvent lever une exception JavaScript.

### Accès rapide

1. [Utilisation : les cinq méthodes du manager](#1-utiliser-le-gamemanager)
2. [Commandes : quoi envoyer et quand ?](#2-commandes-et-cycle-de-jeu)
3. [Réponses : quels champs exploiter ?](#3-état-public-et-types-essentiels)
4. [Erreurs : codes et traitement](#4-erreurs-et-exceptions)
5. [Règles ayant un impact sur l'intégration](#5-règles-et-comportements-à-connaître)
6. [API directe du moteur et utilitaires](#6-api-directe-du-moteur)
7. [Responsabilités de l'intégration et tests](#7-contrat-dintégration-et-tests)

---

## 1. Utiliser le `GameManager`

**Point d'entrée :** `src/game/GameManager.ts` — `export class GameManager`.

Le manager contient une `Map<GameId, GameState>` privée. Une instance gère plusieurs parties, **sans persistance** : il faut conserver la même instance pour retrouver ses parties. Il n'authentifie pas les connexions ; l'appelant doit lui fournir un `userId` vérifié.

| Méthode | Paramètres | Succès / effet | Retour | Échec |
|---|---|---|---|---|
| `new GameManager(random?)` | `random?: () => number` | Initialise un gestionnaire indépendant ; `Math.random` par défaut. | `GameManager` | — |
| `create(input)` | `input: CreateGameInput` | Enregistre une nouvelle partie en `INITIAL_REVEAL`, `version: 0`. | `ManagerResult` | `GAME_ALREADY_EXISTS` ; **exception** si création invalide. |
| `getPublicState(gameId, userId)` | `gameId: GameId`, `userId: PlayerId` | Lit l'état public si le joueur appartient à la partie, **sans modification**. | `ManagerResult` | `GAME_UNAVAILABLE`. |
| `submitAction(gameId, userId, payload, expectedVersion)` | `GameId`, `PlayerId`, `unknown`, `number` | Valide l'action, enregistre le nouvel état et incrémente sa version. | `ManagerResult` | Version, payload ou règle du jeu : [§4](#4-erreurs-et-exceptions). |
| `advanceRound(gameId, expectedVersion)` | `GameId`, `number` | Depuis `ROUND_FINISHED`, crée la manche suivante (`version + 1`). | `ManagerResult` | `GAME_UNAVAILABLE`, `INVALID_ACTION_PAYLOAD`, `VERSION_CONFLICT`, `INVALID_GAME_PHASE`. |
| `remove(gameId)` | `gameId: GameId` | Retire la partie de la mémoire du manager. | `boolean` (`true` si supprimée, `false` si absente) | — (pas de code d’erreur). |

`GameId` et `PlayerId` sont des alias de `string`. `CreateGameInput` correspond à `{ id: string; players: { id: string }[]; targetScore?: number }`.

**Contraintes de création :** `2` à `4` joueurs ; ID de partie et IDs de joueurs non vides (une chaîne uniquement composée d'espaces est refusée) ; IDs de joueurs distincts ; `targetScore` entier sûr strictement positif, **`100` par défaut**. Les IDs sont des chaînes ; le manager ne vérifie pas lui-même leur existence en base.

**Format de retour commun** (`create`, `getPublicState`, `submitAction`, `advanceRound`) :

```ts
type ManagerResult =
  | { ok: true; publicState: PublicGameState }
  | { ok: false; error: { code: ManagerErrorCode } };
```

Un succès renvoie **l'état public complet** (pas un simple accusé de réception ou un `GameState` interne) ; un échec renvoie **uniquement un code d'erreur**, sans `publicState`. Les exceptions levées (`throw`) ne sont pas des `ManagerResult` : voir [§4](#4-erreurs-et-exceptions).

**Trois repères pour l'intégration :**

- **Identité et commande :** `userId` est fourni par le serveur après authentification. `payload` décrit uniquement l'action (`type`, et parfois `position`) ; le manager y ajoute lui-même `playerId` (voir [§2](#2-commandes-et-cycle-de-jeu)).
- **Version :** `expectedVersion` doit être la `publicState.version` la plus récente ; chaque `submitAction()` accepté et chaque `advanceRound()` réussi l'incrémentent de `1`. `getPublicState()` est une lecture seule, utile pour se resynchroniser après `VERSION_CONFLICT`.
- **Opérations de confiance :** `advanceRound()` et `remove()` n'ont **pas** de paramètre `userId` : l'appelant contrôle leur déclenchement et leurs autorisations. `remove()` retourne directement `true` ou `false`, **jamais** un `ManagerResult`.

### Exemple minimal

```ts
import { GameManager } from "./src/game/GameManager";

const manager = new GameManager();
const created = manager.create({
  id: "game-1",
  players: [{ id: "alice" }, { id: "bob" }],
});
if (!created.ok) throw new Error(created.error.code);

const result = manager.submitAction(
  "game-1",
  "alice", // ID obtenu depuis l'authentification serveur
  { type: "REVEAL_INITIAL_CARD", position: 0 },
  created.publicState.version,
);

if (result.ok) {
  // Diffuser result.publicState aux participants autorisés.
} else {
  // Répondre avec result.error.code ; l'état n'a pas changé.
}
```

Chaque participant révèle deux cartes au début : après l'exemple ci-dessus, la partie est **encore** en phase `INITIAL_REVEAL`.

## 2. Commandes et cycle de jeu

### 2.1 Machine à états : quelle action autoriser ?

| `phase` | `turnStage` | Acteur et commandes autorisés |
|---|---|---|
| `INITIAL_REVEAL` | `null` | Chaque joueur révèle **deux** de ses cartes : `REVEAL_INITIAL_CARD(position)`, sans ordre imposé entre joueurs. |
| `PLAYING` | `WAITING_FOR_DRAW` | Joueur courant : `DRAW_DECK` **ou** `DRAW_DISCARD`. |
| `PLAYING` | `DRAWN_FROM_DECK` | Joueur courant : `SWAP_CARD(position)` **ou** `DISCARD_DRAWN_CARD`. |
| `PLAYING` | `MUST_SWAP_DISCARD` | Joueur courant : `SWAP_CARD(position)` **obligatoire**. |
| `PLAYING` | `MUST_REVEAL_CARD` | Joueur courant : `REVEAL_CARD(position)` **obligatoire**. |
| `ROUND_FINISHED` | `null` | Aucune commande de joueur. Passage à la manche suivante via `advanceRound()`. |
| `GAME_OVER` | `null` | Partie terminée ; aucune commande de jeu, ni manche suivante. |

`currentPlayerId` indique qui peut agir pendant `PLAYING` ; il vaut `null` pendant la révélation initiale et après une manche terminée. Les actions sont validées **côté moteur** : la table sert aussi à piloter l'interface, mais ne remplace pas les contrôles.

### 2.2 Payloads exacts et effets

`payload` ne contient **que** `type` et, lorsque nécessaire, `position`. **Pas de `playerId`, pas de `expectedVersion`, pas de propriété supplémentaire** à l'intérieur de cet objet. La version est un argument distinct de `submitAction()`.

| Commande (objet JSON) | Effet et suite |
|---|---|
| `{ "type": "REVEAL_INITIAL_CARD", "position": 0 }` | Retourne la carte cachée choisie. À la deuxième révélation de *chaque* joueur, la phase passe automatiquement à `PLAYING`. |
| `{ "type": "DRAW_DECK" }` | Pioche une carte ; `pendingCard.source = "DECK"` ; passe à `DRAWN_FROM_DECK`. |
| `{ "type": "DRAW_DISCARD" }` | Prend le sommet visible de la défausse ; source `DISCARD` ; passe à `MUST_SWAP_DISCARD`. |
| `{ "type": "SWAP_CARD", "position": 7 }` | Remplace **même une carte déjà révélée**, mais pas une case supprimée ; pose la carte piochée face visible, défausse l'ancienne et **termine le tour**. |
| `{ "type": "DISCARD_DRAWN_CARD" }` | Défausse uniquement une carte venant de la **pioche**, puis impose `MUST_REVEAL_CARD`. **Ne termine pas le tour.** |
| `{ "type": "REVEAL_CARD", "position": 11 }` | Révèle une carte **encore cachée** et **termine le tour**. |

Schéma des tours :

```text
WAITING_FOR_DRAW
├─ DRAW_DISCARD ──> MUST_SWAP_DISCARD ── SWAP_CARD ───────────────┐
└─ DRAW_DECK ────> DRAWN_FROM_DECK ──┬─ SWAP_CARD ────────────────┤
                                    └─ DISCARD_DRAWN_CARD        │
                                       └─ MUST_REVEAL_CARD       │
                                          └─ REVEAL_CARD ────────┘
                                                    Fin du tour
```

**Positions du plateau :** les indices suivent les lignes (pas les colonnes).

```text
 0   1   2   3
 4   5   6   7
 8   9  10  11
```

Une colonne est donc `{0,4,8}`, `{1,5,9}`, `{2,6,10}` ou `{3,7,11}`. Une position doit être un entier entre `0` et `11` ; une case supprimée ne peut plus être ciblée. `SWAP_CARD` accepte une case cachée ou révélée ; les deux actions de révélation exigent une case cachée.

### 2.3 Passage à la manche suivante

Quand un tour termine la manche, **le résultat de cette action** contient déjà les scores et la phase `ROUND_FINISHED` ou `GAME_OVER`.

```ts
if (result.ok && result.publicState.phase === "ROUND_FINISHED") {
  // Déclencher depuis la logique serveur, au moment choisi par l'application.
  const next = manager.advanceRound(
    result.publicState.id,
    result.publicState.version,
  );
  // Si next.ok : diffuser next.publicState ; sinon traiter next.error.code.
}
```

Le passage de manche est **explicite**, pas une action client. Il incrémente aussi `version` de `1`. La manche suivante démarre directement en `PLAYING / WAITING_FOR_DRAW` : **pas de nouvelle révélation initiale**.

## 3. État public et types essentiels

### 3.1 `PublicGameState` — données destinées aux participants

| Champ | Interprétation |
|---|---|
| `id`, `version` | Identifiant et version de l'état ; utiliser **cette** version pour la prochaine commande. |
| `phase`, `turnStage`, `currentPlayerId` | Cycle de vie, étape du tour et joueur autorisé à jouer. |
| `players` | `{ id, board, totalScore }[]` dans l'ordre des tours ; `totalScore` est **cumulatif**. |
| `roundNumber`, `targetScore` | Numéro de manche (débute à `1`) et seuil de fin de partie. |
| `deckCount`, `discardTop` | Nombre de cartes restantes dans la pioche et valeur au sommet de la défausse (`null` si vide). |
| `pendingCard` | `null` ou `{ source: "DECK" | "DISCARD", value }` : carte temporairement prise par le joueur courant. |
| `roundStarterId`, `roundFinisherId` | Premier joueur de la manche et premier joueur ayant terminé son plateau ; `null` lorsque non déterminés. |
| `roundHistory` | Historique des manches **terminées** et de leurs scores. |
| `winnerIds` | Tableau des gagnants en fin de partie, potentiellement plusieurs en cas d'égalité ; vide avant. |

Chaque `players[i].board` conserve **12 positions**. Chaque case publique a l'une de ces formes :

```ts
{ status: "hidden" }                 // valeur masquée
{ status: "revealed", value: 5 }    // valeur visible (-2 à 12)
{ status: "removed" }                // colonne supprimée
```

La valeur de `pendingCard` est **visible à tous les participants** dans cet état public, y compris lorsqu'elle provient de la pioche : **ce n'est pas une vue personnalisée par joueur**. Les valeurs cachées des plateaux, les IDs des cartes, l'ordre/contenu de la pioche et la file des derniers tours ne sont pas exposés.

### 3.2 Différence avec l'état interne

- `GameState` contient notamment `deck`, `discardPile`, `pendingCard` (carte complète), `pendingCardSource`, `finalTurnQueue` et les plateaux avec les valeurs cachées. **Réservé au serveur.**
- `buildPublicState(state)` construit un `PublicGameState` sans modifier l'original ; **n'effectue aucune vérification d'autorisation**. Le manager vérifie l'appartenance pour `getPublicState()` et `submitAction()`.
- `roundHistory` contient des `RoundResult` de forme `{ roundNumber, starterId, finisherId, scores }`, avec `scores: { playerId, baseScore, finalScore }[]`. `baseScore` précède la pénalité éventuelle ; `finalScore` est ajouté au total.

## 4. Erreurs et exceptions

Les erreurs métier sont des **codes symboliques**, pas des codes HTTP ni des messages à afficher tels quels. Une réponse `{ ok: false, error: { code } }` ne modifie pas la partie stockée.

### 4.1 Codes du manager

| Code | Signification |
|---|---|
| `GAME_ALREADY_EXISTS` | `create()` : cet ID est déjà utilisé dans l'instance. |
| `GAME_UNAVAILABLE` | Partie inexistante **ou** acteur extérieur à la partie (lecture/action) ; pour `advanceRound`, partie absente. Ne révèle pas à un non-participant si la partie existe. |
| `VERSION_CONFLICT` | `expectedVersion` diffère de `state.version` ; récupérer le nouvel état avant d'agir. |
| `INVALID_ACTION_PAYLOAD` | Payload non conforme ou version invalide (non entière ou négative). Inclut un champ `playerId` fourni par le client, des clés supplémentaires, un `position` non entier ou un type d'action inconnu. |
| `INVALID_GAME_PHASE` | `advanceRound()` appelé hors de `ROUND_FINISHED`. |

### 4.2 Codes du moteur (également propagés par le manager)

| Code | Signification |
|---|---|
| `UNKNOWN_ACTION` | Type de commande inconnu envoyé **directement au moteur** ; en passant par le manager, il est filtré comme `INVALID_ACTION_PAYLOAD`. |
| `GAME_OVER` | Action de jeu tentée sur une partie terminée. |
| `PLAYER_NOT_FOUND` | `playerId` inconnu du moteur ; le manager contrôle normalement l'appartenance en amont. |
| `NOT_YOUR_TURN` | Un participant différent de `currentPlayerId` agit pendant `PLAYING`. |
| `ACTION_NOT_ALLOWED` | Commande incompatible avec la phase/étape actuelle, ou troisième révélation initiale d'un joueur. |
| `INVALID_POSITION` | Index hors `0..11`, ou case supprimée visée par un échange/une révélation. |
| `CARD_NOT_HIDDEN` | Tentative de révéler une carte déjà révélée. |

**Deux niveaux de vérification :** le manager valide d'abord l'appartenance, la version et la **forme** du payload ; le moteur vérifie la légalité de l'action. Par exemple, `position: 1.5` produit `INVALID_ACTION_PAYLOAD`, mais `position: 99` produit `INVALID_POSITION`. Les vérifications sont ordonnées : ne pas supposer qu'une requête cumulant plusieurs erreurs renverra toujours le même code.

**Exceptions (`throw`) :** à distinguer des erreurs ci-dessus. `create()` relaie les exceptions de `createGame()` pour ses paramètres invalides. Le moteur peut aussi lever une exception lorsqu'un `GameState` viole ses invariants, lors d'une source aléatoire invalide ou d'une impossibilité interne (pile insuffisante, état de manche incohérent, etc.). Les méthodes du manager **ne convertissent pas** ces exceptions en `ManagerResult`. Les intercepter à la frontière HTTP/Socket, journaliser côté serveur, ne pas exposer le détail technique aux clients.

## 5. Règles et comportements à connaître

- **Distribution :** 150 cartes (`-2` ×5 ; `-1` ×10 ; `0` ×15 ; chaque valeur `1` à `12` ×10). Chaque joueur reçoit 12 cartes cachées, une carte initialise la défausse. La pioche est remélangée à chaque nouvelle manche.
- **Premier joueur :** dès que chacun a révélé deux cartes, la plus forte **somme des deux cartes** commence. Une égalité est départagée aléatoirement. Pour les manches suivantes, c'est **le joueur ayant terminé la manche précédente** qui commence.
- **Colonne :** trois cartes verticales **révélées et identiques** sont retirées lors d'un échange ou d'une révélation en cours de tour. Elles deviennent des cases `removed`, comptent pour zéro et leurs cartes partent dans la défausse. De nouvelles colonnes peuvent aussi être retirées lors de la résolution de fin de manche, après révélation générale.
- **Fin de manche :** dès qu'un joueur n'a plus aucune carte cachée, il est `roundFinisherId`. **Chaque autre joueur dispose exactement d'un dernier tour**, dans l'ordre normal. Ensuite : révélation des plateaux, suppression des colonnes complètes, calcul des scores, mise à jour des totaux et de `roundHistory`.
- **Pénalité du premier à finir :** si son score de plateau est **strictement positif** et qu'au moins un adversaire a un score de plateau **inférieur ou égal**, son score de manche est **doublé**. Un score nul ou négatif n'est jamais doublé. Les scores des autres joueurs restent inchangés.
- **Fin de partie :** après calcul d'une manche, si **au moins un** score cumulé atteint `targetScore`, la partie passe à `GAME_OVER`. Le ou les joueurs au **plus petit total** gagnent (`winnerIds`).
- **Pioche vide :** lors du prochain `DRAW_DECK`, le moteur mélange la défausse **en gardant sa carte du dessus** ; cette dernière reste visible. Si la défausse contient moins de deux cartes, il lève une exception d'invariant.

## 6. API directe du moteur

**Point d'entrée public :** `game/index.ts`. À utiliser pour des appels de confiance, des tests ou une orchestration différente du manager. Contrairement au manager, le moteur **ne vérifie ni identité authentifiée, ni version attendue, ni droits d'accès externes**.

| Export | Signature / contrat |
|---|---|
| `createGame` | `(input: CreateGameInput, random?: () => number): GameState` — crée l'état privé, `version = 0`, `INITIAL_REVEAL` ; lève une exception si création invalide. |
| `applyAction` | `(oldState: GameState, command: GameCommand, random?: () => number): ApplyActionResult` — action avec **`playerId` fourni par l'appelant de confiance** ; clone l'état puis renvoie succès ou erreur. |
| `startNextRound` | `(oldState: GameState, random?: () => number): GameState` — exige `ROUND_FINISHED` et un état résolu cohérent ; clone, redistribue, conserve les totaux et l'historique ; augmente `roundNumber` et `version`. |
| `buildPublicState` | `(state: GameState): PublicGameState` — construit la vue publique, **sans contrôle d'accès**. |
| Constantes | `ACTION`, `PHASE`, `TURN_STAGE`, `ERROR_CODE` — valeurs de chaînes exposées dans `game/index.ts`. |
| Types | `GameCommand`, `GameState`, `CreateGameInput`, `ApplyActionResult`, `PublicGameState`, `RoundResult`, `RoundPlayerScore`, `GameId`, `PlayerId` (types TypeScript, pas des valeurs à l'exécution). |

```ts
type ApplyActionResult =
  | { ok: true; state: GameState; publicState: PublicGameState }
  | { ok: false; error: { code: ErrorCode } };

// Dans GameCommand, chaque action comporte playerId.
// Dans ClientGameAction (GameManager), playerId est absent.
```

**Immutabilité :** `applyAction()` et `startNextRound()` travaillent sur une copie profonde (`structuredClone`) et ne modifient pas leur argument. Une action réussie renvoie un **nouveau** `GameState` ; c'est à l'appelant de le conserver. Un succès incrémente `version` une fois, y compris si l'action termine une manche. Une erreur structurée n'altère pas l'état initial.

### Utilitaires exportés directement par leurs fichiers

Ils sont destinés aux tests et à l'implémentation interne, **pas** au traitement direct de commandes réseau. Ils ne sont **pas réexportés** par `game/index.ts`, à l'exception de `buildPublicState`.

| Fichier | Fonctions exportées et rôle |
|---|---|
| `deck.ts` | `createDeck(): Card[]` (150 cartes) ; `shuffleDeck(deck: readonly Card[], random?: () => number): Card[]` (nouveau tableau, Fisher–Yates) ; `takeTopCard(deck: Card[]): Card` (retire le dernier élément, **mutation**, exception si vide). |
| `board.ts` | `isValidBoardPosition(position: number): boolean` ; `getColumnPositions(position: number): readonly [number,number,number]` ; `removeCompletedColumnAtPosition(player, position, discardPile): boolean` (**mutation** si colonne retirée) ; `revealAllCards(player): void` ; `removeAllCompletedColumns(player, discardPile): void` (**mutations**). |
| `turn.ts` | `hasHiddenCards(player): boolean` ; `getNextPlayerId(players, currentPlayerId): PlayerId` (ordre circulaire) ; `buildFinalTurnQueue(players, finisherId): PlayerId[]` (tous les autres joueurs dans cet ordre). |
| `scoring.ts` | `calculateBoardScore(player): number` (plateau révélé, cases supprimées à zéro) ; `calculateFinisherScore(finisherBaseScore, otherBaseScores): number` (éventuel doublement) ; `buildRoundResult(players, roundNumber, starterId, finisherId): RoundResult` (calcule sans modifier les totaux). |
| `stateMachine.ts` | `getAllowedActionTypes(state): ActionType[]` (actions autorisées **globalement**, sans contrôle de l'identité du joueur). |
| `publicState.ts` | `buildPublicState(state): PublicGameState` (projection sans autorisation). |

Les fonctions utilitaires manipulant l'état interne attendent des données cohérentes ; certaines **modifient leurs arguments** et peuvent lever une exception plutôt que renvoyer une erreur structurée. `random` doit retourner un nombre réel dans l'intervalle `[0, 1)`.

## 7. Contrat d'intégration et tests

**Responsabilités de l'appelant :** authentifier le joueur avant d'appeler le manager ; associer sa session à un `userId` fiable ; déterminer quels participants reçoivent chaque `publicState` ; gérer les doublons/conflits de version et les exceptions ; déclencher `advanceRound()` depuis une logique serveur ; assurer, si nécessaire, la persistance, les délais, les déconnexions et la coordination entre plusieurs processus. Ce sont des **frontières de responsabilité**, pas des indications sur l'avancement de l'application.

**Invariants utiles :**

- Un `GameManager` garde l'état faisant autorité. Ne pas reconstruire les tours côté client.
- Une action rejetée ne change pas la version ; après succès, utiliser **la version renvoyée**, y compris pour une deuxième sous-action d'un même tour.
- Ne pas confondre `deckCount` et nombre total de cartes restantes : la carte en attente est sortie de sa pile.
- `getAllowedActionTypes()` renseigne les types valides pour une phase/étape, **pas** les droits d'un joueur ni les cases ciblables.
- L'accès à `getPublicState()` est réservé aux participants ; l'appel interne à `advanceRound()` n'a pas de `userId`, donc ne doit pas être exposé directement comme commande client.

**Vérification depuis `srcs/backend/` :**

```bash
npm run game:check    # Vérification des types
npm run game:test     # Tests moteur + GameManager
npm run game:verify   # Les deux
```

**Références de code :** `game/index.ts`, `game/types.ts`, `game/constants.ts`, `game/engine.ts`, `game/publicState.ts`, `src/game/GameManager.ts`. Les tests de comportement se trouvent dans `game/test/` et `src/game/test/`.
