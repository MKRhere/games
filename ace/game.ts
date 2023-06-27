import { split, reorder, shuffle, equal, exhaustive } from "../utils.js";
import { French } from "../packs/mod.js";

export type Card = French.Card;

export interface Player {
	id: string;
	name: string;
	hand: Card[];
}

export namespace Input {
	export interface Play {
		type: "play";
		card: Card;
	}

	export interface Cut {
		type: "cut";
		card: Card;
	}

	export interface Offer {
		type: "offer";
		player: Player;
	}

	export interface Accept {
		type: "accept";
		player: Player;
	}
}

export type Input = Input.Play | Input.Cut | Input.Offer | Input.Accept;

export namespace Output {
	export interface Winners {
		type: "winners";
		players: Player[];
	}

	export interface Loser {
		type: "loser";
		player: Player;
	}

	export interface Invalid {
		type: "invalid";
		msg: string;
	}
}

export type Output = Output.Winners | Output.Loser | Output.Invalid;

interface PileItem {
	index: number;
	player: Player;
	card: Card;
}

export async function* AceGame(
	players: Player[],
	input: (player: Player, suggestions: Input[]) => Promise<Input>,
): AsyncGenerator<Output> {
	const deck = shuffle(French.Pack);
	split(deck, players.length).forEach((hand, i) => (players[i].hand = French.sort(hand)));

	const starting = players.findIndex(player =>
		player.hand.find(card => card.suit === French.Suits.Spades && card.rank === French.Ranks.Ace),
	);

	if (starting < 0) throw new Error("No player has the Ace of Spades");

	players = reorder(players, starting);

	let ended = false;

	while (!ended) {
		let suit: Card["suit"] | null = null;
		let high: PileItem | null = null;
		const pile: PileItem[] = [];

		for (let index = 0; index < players.length; index++) {
			const player = players[index];
			const hand = player.hand;
			const playable = hand.filter(card => !suit || card.suit === suit);
			const suggestions: Input[] = playable.length
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
			}

			if (a.type === "cut") {
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
