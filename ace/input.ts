import { French } from "../packs/mod.js";
import { Player } from "./player.js";

export interface Play {
	type: "play";
	card: French.Card;
}

export interface Cut {
	type: "cut";
	card: French.Card;
}

export interface Offer {
	type: "offer";
	player: Player;
}

export interface Accept {
	type: "accept";
	player: Player;
}

export type Any = Play | Cut | Offer | Accept;
