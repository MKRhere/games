import { French } from "../packs/mod.js";

export interface Player {
	id: string;
	name: string;
	hand: French.Card[];
}
