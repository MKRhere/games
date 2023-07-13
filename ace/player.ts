import { French } from "../packs/mod.ts";

export interface Player {
	id: string;
	name: string;
	hand: French.Card[];
}
