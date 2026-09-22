# SKYJO - Game Rules

> Project rules for the digital SKYJO implementation. The official Magilano rulebook is the normative source for the core game mechanics. The final section documents the additional decisions required by this project for ties, pile exhaustion, timeouts, disconnections, and abandonment.

## Quick summary

- **Players:** 2-8.
- **Goal:** finish the game with the **lowest total score**.
- Each player starts every round with **12 face-down cards arranged as 3 rows x 4 columns** and reveals any **2 cards**.
- On your turn, either:
  1. take the top face-up card from the discard pile and **exchange it** with one of your cards; or
  2. draw the top face-down card from the draw pile, then either **exchange it** with one of your cards or **discard it and reveal one of your face-down cards**.
- Three identical face-up cards in the **same vertical column** are immediately removed and put on the discard pile.
- A round is triggered to end when one player has no face-down cards left. Every other player then gets **one final turn**.
- After final column removals, each player adds the values of all cards still in their tableau.
- The player who triggered the end of the round must have a **strictly lower** round score than every other player. If another player has an equal or lower score, the finisher's **positive** round score is doubled. Zero and negative scores are never doubled.
- Round scores are added to the cumulative score. After a round in which at least one player reaches **100 points or more**, the game ends; the lowest cumulative score wins.

---

## 1. Components and deck

The official game contains **150 playing cards**.

| Card value | Number of cards |
| ---: | ---: |
| `-2` | 5 |
| `0` | 15 |
| `-1` | 10 |
| `1` to `12` | 10 of each value |

![Official SKYJO card distribution](assets/official-card-distribution.png)

*Official card distribution from the Magilano rulebook, page 24.*

The values printed on the cards are also their point values. Lower values are therefore generally preferable.

## 2. Objective of the game

SKYJO is played over several rounds. Players accumulate points from round to round.

The objective is to keep that cumulative score as low as possible. The normal game-end threshold is reached when, after scoring a round, at least one player has a cumulative score of **100 points or more**. The player or players with the lowest cumulative score then win.

## 3. Terminology

- **Tableau:** the cards belonging to one player during a round.
- **Face-down card:** a card in a player's tableau whose value is still hidden.
- **Face-up card:** a revealed card whose value is visible to everyone.
- **Draw pile:** the face-down pile from which unknown cards are drawn.
- **Discard pile:** the face-up pile; only its top card can be taken on a normal turn.
- **Finisher:** the player whose tableau first contains no face-down cards and therefore triggers the final-turn phase of the round.
- **Round score:** the points obtained from one round after all applicable column removals and any finisher penalty.
- **Cumulative score:** the sum of a player's round scores over the whole game.

## 4. Preparing a round

1. Shuffle the complete deck.
2. Deal **12 cards face down** to every player.
3. Each player arranges those 12 cards as a fixed **3 x 4 tableau**:

   ```text
   [ ? ] [ ? ] [ ? ] [ ? ]
   [ ? ] [ ? ] [ ? ] [ ? ]
   [ ? ] [ ? ] [ ? ] [ ? ]
     C1    C2    C3    C4
   ```

   Each vertical column therefore contains exactly three positions.
4. Place one additional card face up in the centre. It becomes the first card of the **discard pile**.
5. Place all remaining cards face down beside it as the **draw pile**.
6. Every player chooses **two cards from their own tableau** and reveals them.

Players may not look at any other face-down tableau card while choosing their initial two cards.

## 5. Choosing the starting player

### First round

Add the values of each player's two initially revealed cards. The player with the **highest sum** starts the first round.

Example: a player revealing `12` and `-2` has a starting sum of `10`; a player revealing `4` and `2` has a starting sum of `6`. The first player starts because `10 > 6`.

For this project, a tie for the highest initial sum is resolved by the server-controlled **rock-paper-scissors tie-break procedure** defined for the game.

### Later rounds

The player who **finished the previous round** starts the next round.

## 6. Turn order

Play proceeds **clockwise**.

A normal turn always begins by choosing exactly one of two sources:

- the top face-up card of the discard pile; or
- the top face-down card of the draw pile.

The consequences differ depending on which source was chosen.

## 7. Taking the top card from the discard pile

If a player takes the visible top card of the discard pile:

1. The card **must be kept**. It cannot simply be discarded again.
2. The player chooses exactly one card in their own tableau to replace.
3. The chosen tableau card may be either face up or face down.
4. If the chosen tableau card is face down, the player may **not look at it before committing to the exchange**.
5. The card taken from the discard pile is placed face up in that tableau position.
6. The replaced tableau card is placed face up on top of the discard pile.
7. Apply the identical-column rule if the exchange created a completed column of three equal face-up cards.
8. The turn ends.

## 8. Drawing from the draw pile

If a player draws the top face-down card of the draw pile, the player may privately inspect its value and choose between two actions.

### 8.1 Keep the drawn card

The player exchanges it with one card in their tableau:

1. Choose one face-up or face-down tableau card.
2. A face-down target may not be inspected before choosing it.
3. Put the drawn card face up in that tableau position.
4. Put the replaced tableau card face up on the discard pile.
5. Apply the identical-column rule if applicable.
6. The turn ends.

### 8.2 Reject the drawn card

The player may instead decline to keep the drawn card:

1. Put the drawn card face up on top of the discard pile.
2. Choose **one currently face-down card** in the player's own tableau.
3. Reveal that card in place; it is not exchanged or moved.
4. Apply the identical-column rule if this reveal completes a column of three equal cards.
5. The turn ends.

A player cannot reject the drawn card without revealing one of their own remaining face-down cards.

## 9. Three identical cards in a vertical column

Whenever all three positions of one vertical column contain **face-up cards of the same value**, the whole column is removed from the tableau and placed on the discard pile.

![Official example of a three-card column being removed](assets/official-column-removal.png)

*Official Magilano illustration, page 5: an exchange completes a vertical triplet, which is then removed.*

Important consequences:

- The removed three cards no longer belong to the player's tableau and therefore score **0 points** for that round.
- The three positions remain empty; they are not refilled.
- The rule applies regardless of whether the third matching card appeared because of an exchange or because a face-down card was revealed.
- If a turn creates the column through an exchange, the **replaced card is put on the discard pile first**, then the three matching cards are placed on the discard pile afterwards. Consequently, one of the matching cards is left on top of the discard pile.
- The rule also applies during end-of-round resolution when still-hidden cards are revealed for scoring.
- If several complete identical columns exist after the final reveal, **all qualifying columns are removed before the tableau is scored**.

## 10. Triggering the end of a round

A player becomes the **finisher** as soon as, after resolving their action and all resulting column removals, they have **no face-down cards remaining** in their tableau.

This does not immediately stop the round. It starts the **final-turn phase**.

Every other active player receives exactly **one additional turn**, proceeding clockwise, until play would return to the finisher. The finisher does not take another turn in that phase.

## 11. End-of-round reveal and column resolution

After every other player has taken their final turn:

1. Reveal every tableau card that is still face down.
2. Check again for vertical columns containing three identical values.
3. Remove every such column before scoring.
4. Sum the values of all cards that remain in each player's tableau.

Removed cards are not included in the score.

## 12. Round scoring and the finisher penalty

The normal round score is the sum of all card values still present in a player's tableau after column removal.

The finisher is subject to an additional rule: the finisher must have a score **strictly lower than every other player's score for that round**.

If any other player has a round score that is **lower than or equal to** the finisher's score, then:

- if the finisher's score is **positive**, it is doubled;
- if the finisher's score is `0` or negative, it is **not** doubled.

No other player's score is doubled by this rule.

![Official scoring example](assets/official-scoring-example.png)

*Official Magilano example, page 5: A finishes on 10, B has 24, and C also has 10. Because A is tied rather than strictly lower, A's positive round score is doubled to 20.*

### Examples

| Finisher | Best other score | Penalty? | Recorded finisher score |
| ---: | ---: | :---: | ---: |
| `10` | `12` | No | `10` |
| `10` | `10` | Yes | `20` |
| `10` | `5` | Yes | `20` |
| `0` | `-1` | No doubling | `0` |
| `-2` | `-5` | No doubling | `-2` |

The resulting round score is then added to each player's cumulative score.

## 13. End of the game

After all scores for a round have been finalized and added to the cumulative totals, check the game-end threshold.

If **no player has reached 100 points**, prepare another round.

If **at least one player has reached 100 points or more**, the game ends. The winner is the active player with the **lowest cumulative score**.

For this project, if several players are tied for the lowest final cumulative score, they are **co-winners**. No additional tie-break is used for the final result.

## 14. Project-specific digital rules

The printed rulebook does not define several situations required by an online implementation. The following rules are therefore normative for this project.

### 14.1 Empty draw pile

If the draw pile is empty when a draw is required:

1. Keep the current **top card of the discard pile** in place.
2. Take every other card from the discard pile.
3. Shuffle those cards.
4. Use them as the new face-down draw pile.

The visible top discard card is never included in that reshuffle.

### 14.2 Initial reveal timeout

If a player does not choose their two initial cards before the initial-reveal timer expires, the server randomly selects and reveals **two valid face-down cards** from that player's tableau.

### 14.3 Turn timeout

If the configured turn timer expires before the player submits a valid action, the server automatically performs a **legal random turn** on that player's behalf.

An automatically completed turn counts as a timeout for abandonment tracking.

### 14.4 Consecutive timeout abandonment

After **three consecutive automatically played turns**, the player is considered to have abandoned the game.

A valid manually played turn breaks the consecutive-timeout sequence.

### 14.5 Disconnection and definitive abandonment

A player who definitively disconnects or abandons the match receives a **loss**.

The withdrawn player is removed from the active turn rotation. Their cards may remain in the current round state until normal round cleanup, but the player no longer takes turns and cannot win the match.

### 14.6 Last active human player

The game continues only while at least **two active human players** remain. If every other human player has abandoned or been definitively disconnected, the **last active human player wins by forfeit**, regardless of the current cumulative scores.

### 14.7 Bot takeover

Automatic bot takeover after a disconnection is **not part of the finalized rules** and is therefore outside the normative behavior defined by this document.

## 15. Rules invariants useful for implementation

The following properties should remain true throughout the game engine:

- A player's tableau starts with 12 occupied positions arranged in four vertical columns of three.
- Tableau cards never move between positions except by replacement; column removal empties exactly three positions.
- Every occupied tableau position is either face down or face up.
- A card taken from the discard pile is always exchanged; it is never rejected.
- A card drawn from the draw pile is either exchanged into the tableau or discarded followed by exactly one reveal.
- A face-down tableau card is never inspected before the player commits to replacing it.
- Every card discarded or removed from a tableau is face up on the discard pile.
- A completed identical column is resolved before the active turn or scoring resolution is considered complete.
- Once the final-turn phase begins, each remaining active player receives at most one final turn.
- All remaining face-down cards are revealed before the round is scored.
- All complete identical columns discovered during the final reveal are removed before scores are summed.
- Only the finisher can receive the round-score doubling penalty.
- The finisher penalty never doubles a zero or negative score.
- Cumulative scores change only when a round is scored.
- The normal 100-point game-end condition is evaluated only after round scores have been added.
