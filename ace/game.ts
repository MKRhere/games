import { split, reorder, shuffle, equal, exhaustive } from "../utils.ts";
import { French } from "../packs/mod.ts";
import * as Input from "./input.ts";
import * as Output from "./output.ts";
import type { Player } from "./player.ts";

export { Input, Output, Player };
export type Card = French.Card;

interface PileItem {
	index: number;
	player: Player;
	card: Card;
}

export async function* AceGame(
	players: Player[],
	input: (player: Player, suggestions: Input.Any[]) => Promise<Input.Any>,
): AsyncGenerator<Output.Any> {
	const deck = shuffle(French.Pack);
	split(deck, players.length).forEach((hand, i) => (players[i].hand = French.sort(hand)));

	const starting = players.findIndex(player =>
		player.hand.find(card => card.suit === French.Suits.Spades && card.rank === French.Ranks.Ace),
	);

	if (starting < 0) throw new Error("No player has the Ace of Spades");

	players = reorder(players, starting);

	while (true) {
		let suit: Card["suit"] | null = null;
		let high: PileItem | null = null;
		const pile: PileItem[] = [];

		for (let index = 0; index < players.length; index++) {
			const player = players[index];
			const hand = player.hand;
			const playable = hand.filter(card => !suit || card.suit === suit);
			const suggestions: Input.Any[] = playable.length
				? playable.map(card => ({ type: "play", card }))
				: hand.map(card => ({ type: "cut", card }));

			let action;

			while (true) {
				const playerInput = await input(player, suggestions);
				if (playerInput.type === "offer") {
					if (playerInput.player === player)
						yield { type: "invalid", msg: "Cannot offer yourself your own hand" };
					if (suggestions.some(s => equal(s, playerInput))) {
						yield { type: "invalid", msg: "Already offered" };
						continue;
					}
					suggestions.push({ type: "accept", player: playerInput.player });
					continue;
				} else if (playerInput.type === "accept") {
					const offerer = playerInput.player;
					// remove offerer from players
					players = players.filter(player => equal(player, offerer));
					// offerer is a winner
					yield { type: "winners", players: [offerer] };
					// merge offerer's hand with current player
					player.hand = player.hand.concat(offerer.hand);
					continue;
				}
				action = suggestions.find((s): s is Input.Play | Input.Cut => equal(s, playerInput));
				if (action) break;
				else yield { type: "invalid", msg: "Invalid input from player" };
			}

			const card = action.card;
			suit = card.suit;

			const handIndex = player.hand.findIndex(handCard => handCard === card);
			if (handIndex < 0) throw new Error("Played card is not in hand");
			player.hand.splice(handIndex, 1);

			pile.push({ index, player, card });

			// TS needs this, or doesn't understand exhaustive(action) below
			const a = action;

			if (a.type === "play") {
				if (!high || card.rank.index > high.card.rank.index) high = { index, player, card };

				continue;
			} else if (a.type === "cut") {
				if (!high) throw new Error("No cards in pile, cannot cut!");
				high.player.hand.push(...pile.map(p => p.card));

				break;
			}

			exhaustive(a);
		}

		players = reorder(players, high!.index);

		let winners = players.filter(player => player.hand.length === 0);
		players = players.filter(player => player.hand.length > 0);
		const loser = players.length < 2 ? players[0] : players.length < 1 ? high!.player : null;
		winners = winners.filter(winner => winner !== loser);

		if (winners.length) yield { type: "winners", players: winners };
		if (loser) return yield { type: "loser", player: loser };
	}
}
