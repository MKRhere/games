import { French } from "../packs/mod.ts";
import { Player } from "./player.ts";

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
