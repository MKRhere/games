import { createInterface } from "readline/promises";
import chalk from "chalk";

import { AceGame, Card, Input, Output, Player } from "./game.ts";
import { chunk } from "../utils.ts";

const colour = (card: Card) => (card.suit.index % 2 ? chalk.red : chalk.white);

const rl = createInterface(process.stdin, process.stdout);
const prompt = rl.question.bind(rl);

const count = parseInt(await prompt("Number of players? ")!);
if (Number.isNaN(count) || count < 2) throw new Error("Unexpected input. Enter a valid number 2 or above.");

const players = Array.from(
	{ length: count },
	(_, i): Player => ({
		id: String(i),
		name: String.fromCharCode(65 + i),
		hand: [],
	}),
);

const coloured = (card: Card) => colour(card)(`${card.suit.sym} ${card.rank.sym}`);

const serialiseHand = (player: Player) =>
	chunk(player.hand, 5)
		.map(chunk => chunk.map(coloured).join(" / "))
		.join("\n");

const buildPrompt = (player: Player, inputs: string) =>
	[
		`Player ${player.name}'s turn`,
		`[Hand: ${player.hand.length}]`,
		serialiseHand(player),
		`Possible inputs:`,
		inputs,
	].join("\n\n");

function mapInput(player: Player, input: Input.Any): string {
	switch (input.type) {
		case "play":
			return player.name + " played " + coloured(input.card);
		case "cut":
			return player.name + " cut with " + coloured(input.card);
		case "offer":
			return input.player.name + " offered their hand to " + player.name;
		case "accept":
			return player.name + " accepted " + `${input.player.name}'s offer`;
	}
}

function mapOutput(output: Output.Any): string {
	switch (output.type) {
		case "invalid":
			return "Invalid: " + output.msg;
		case "winners":
			return `${join(output.players)} ${haveHas(output.players.length)} won!`;
		case "loser":
			return output.player.name + " has lost.";
	}
}

let outputCache = "";

async function inputController(player: Player, inputs: Input.Any[]): Promise<Input.Any> {
	console.log(outputCache);
	outputCache = "";

	while (true) {
		const possibleInputs = inputs
			.filter((input): input is Input.Play | Input.Cut => input.type === "play" || input.type === "cut")
			.map((input, index) => `[${index}] ${input.type} / ${coloured(input.card)}`)
			.join("\n");

		console.log(buildPrompt(player, possibleInputs));

		const res = parseInt(await prompt(`\nMove [${0}-${inputs.length - 1}]: `)!);

		if (Number.isNaN(res) || res > inputs.length - 1 || res < 0) {
			console.log("Invalid input. Try again.");
			continue;
		}

		const input = inputs[res]!;

		outputCache += "\n" + mapInput(player, input) + "\n\n===";

		return input;
	}
}

const join = (players: Player[]) => players.map(player => player.name).join(", ");
const haveHas = (num: number) => (num > 1 ? "have" : "has");

for await (const output of AceGame(players, inputController)) {
	outputCache += "\n" + mapOutput(output);
}

console.log(outputCache);
