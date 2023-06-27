import { createInterface } from "readline/promises";
import chalk from "chalk";

import { Ace, Card, Input, Player } from "./game.js";
import { French } from "../packs.js";
import { chunk, exhaustive } from "../utils.js";

const colour = (card: Card) => (French.suitPos(card) % 2 ? chalk.red : chalk.white);

const rl = createInterface(process.stdin, process.stdout);
const prompt = rl.question.bind(rl);

const count = parseInt(await prompt("Number of players? ")!);
if (Number.isNaN(count) || count < 2) throw new Error("Unexpected input. Enter a valid number 2 or above.");

console.log("\n");

const players = Array.from(
	{ length: count },
	(_, i): Player => ({
		id: String(i),
		name: String.fromCharCode(65 + i),
		hand: [],
	}),
);

const coloured = (card: Card) => colour(card)(`${card.suit} ${card.rank}`);

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

const printInput = (player: Player, input: Input) => {
	if (input.type === "play") console.log(player.name, "played", coloured(input.card));
	else if (input.type === "cut") console.log(player.name, "cut with", coloured(input.card));
	else if (input.type === "offer") console.log(input.player.name, "offered their hand to", player.name);
	else if (input.type === "accept") console.log(player.name, "accepted", `${input.player.name}'s offer`);
	else exhaustive(input);

	console.log("\n===\n");
};

const inputController = async (player: Player, inputs: Input[]) => {
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

		printInput(player, input);

		return input;
	}
};

const join = (players: Player[]) => players.map(player => player.name).join(", ");
const haveHas = (num: number) => (num > 1 ? "have" : "has");

for await (const output of Ace(players, inputController)) {
	if (output.type === "invalid") console.log("Invalid:", output.msg);
	else if (output.type === "winners") console.log(`${join(output.players)} ${haveHas(output.players.length)} won!`);
	else if (output.type === "loser") console.log(`${output.player.name} has lost.`);
}