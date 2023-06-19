import { createInterface } from "readline/promises";
import chalk from "chalk";

import { split, reorder, shuffle, chunk } from "./utils.js";

const Suits = ["♠️", "♥️", "♣️", "♦️"] as const;
const Ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K", "A"] as const;

interface Card {
	suit: (typeof Suits)[number];
	rank: (typeof Ranks)[number];
}

const suit = (card: Card) => Suits.findIndex(suit => suit === card.suit);
const rank = (card: Card) => Ranks.findIndex(rank => rank === card.rank);

interface Player {
	name: string;
	hand: Card[];
}

namespace Input {
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

type Input = Input.Play | Input.Cut | Input.Offer | Input.Accept;

namespace Output {
	export interface Winners {
		type: "winners";
		players: Player[];
	}

	export interface Loser {
		type: "loser";
		player: Player;
	}
}

type Output = Output.Winners | Output.Loser;

const PACK: Card[] = [];

for (const rank of Ranks) {
	PACK.push({ rank, suit: Suits[0] });
	PACK.push({ rank, suit: Suits[1] });
	PACK.push({ rank, suit: Suits[2] });
	PACK.push({ rank, suit: Suits[3] });
}

function exhaustive(input: never): void {}

function equal<O extends Input>(a: O, b: O) {
	for (const key of Object.keys(a)) if (a[key as keyof O] !== b[key as keyof O]) return false;
	return true;
}

async function ace(
	players: Player[],
	input: (player: Player, suggestions: Input[]) => Promise<Input>,
	output: (out: Output) => Promise<void>,
) {
	const deck = shuffle(PACK);
	split(deck, players.length).forEach(
		(hand, i) => (players[i].hand = hand.sort((a, b) => rank(b) - rank(a)).sort((a, b) => suit(a) - suit(b))),
	);

	const starting = players.findIndex(player => player.hand.find(card => card.suit === Suits[0] && card.rank === "A"));
	if (starting < 0) throw new Error("No player has the Ace of Spades");

	players = reorder(players, starting);

	let ended = false;

	while (!ended) {
		interface PileItem {
			index: number;
			player: Player;
			card: Card;
		}

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
					if (playerInput.player === player) throw new Error("Cannot offer yourself your own hand");
					if (suggestions.some(s => equal(s, playerInput))) throw new Error("Already offered");
					suggestions.push({ type: "accept", player: playerInput.player });
					continue;
				} else if (playerInput.type === "accept") {
					const offerer = playerInput.player;
					// remove offerer from players
					players = players.filter(player => equal(player, offerer));
					// offerer is a winner
					output({ type: "winners", players: [offerer] });
					// merge offerer's hand with current player
					player.hand = player.hand.concat(offerer.hand);
					continue;
				}
				action = suggestions.find((s): s is Input.Play | Input.Cut => equal(s, playerInput));
				if (action) break;
				else throw new Error("Invalid input from player");
			}

			const card = action.card;
			suit = card.suit;

			const handIndex = player.hand.findIndex(handCard => handCard === card);
			if (handIndex < 0) throw new Error("Played card is not in hand");
			player.hand.splice(handIndex, 1);

			pile.push({ index, player, card });

			if (action.type === "play") {
				if (!high || rank(card) > rank(high.card)) high = { index, player, card };

				continue;
			}

			if (action.type === "cut") {
				if (!high) throw new Error("No cards in pile, cannot cut!");
				high.player.hand.push(...pile.map(p => p.card));

				break;
			}

			exhaustive(action);
		}

		players = reorder(players, high!.index);

		let winners = players.filter(player => player.hand.length === 0);
		players = players.filter(player => player.hand.length > 0);
		const loser = players.length < 2 ? players[0] : players.length < 1 ? high!.player : null;
		winners = winners.filter(winner => winner !== loser);

		if (winners.length) await output({ type: "winners", players: winners });
		if (loser) return output({ type: "loser", player: loser });
	}
}

const colour = (card: Card) => (suit(card) % 2 ? chalk.red : chalk.white);

const { question: prompt } = createInterface(process.stdin, process.stdout);

const count = parseInt(await prompt("Number of players?")!);
if (Number.isNaN(count) || count < 2) throw new Error("Unexpected input. Enter a valid number 2 or above.");

console.log("\n");

ace(
	Array.from({ length: count }, (_, i) => ({ name: String.fromCharCode(65 + i), hand: [] })),
	async (player, inputs) => {
		while (true) {
			console.log(`Player ${player.name}'s turn\n`);
			console.log(`[Hand: ${player.hand.length}]`);
			console.log(
				chunk(player.hand, 5)
					.map(chunk => chunk.map(card => colour(card)(`${card.suit} ${card.rank}`)).join(" / "))
					.join("\n"),
			);
			console.log(`\nPossible inputs:`);
			console.log(
				inputs
					.filter(input => input.type === "play" || input.type === "cut")
					.map((input, index) =>
						colour(input.card)(`[${index}] ${input.type} / ${input.card.suit} ${input.card.rank}`),
					)
					.join("\n"),
			);

			const res = parseInt(await prompt(`Move [${0}-${inputs.length - 1}]: `)!);

			if (Number.isNaN(res) || res > inputs.length - 1 || res < 0) {
				console.log("Invalid input. Try again.");
				continue;
			}
			const input = inputs[res]!;
			console.log(player.name, "played", input.type, input.card.suit, input.card.rank);
			console.log("\n===\n");
			return input;
		}
	},
	async out => {
		if (out.type === "winners")
			return console.log(
				`${out.players.map(winner => winner.name).join(", ")} ${out.players.length > 1 ? "have" : "has"} won!`,
			);
		if (out.type === "loser") return console.log(`${out.player.name} has lost.`);
	},
);
