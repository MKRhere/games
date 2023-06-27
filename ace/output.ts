import { Player } from "./player.js";

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

export type Any = Winners | Loser | Invalid;
