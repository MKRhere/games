import * as Ranks from "./ranks.js";
import * as Suits from "./suits.js";

export { Ranks, Suits };

export interface JokerCard {
	suit: undefined;
	rank: Ranks.Joker;
}

export const JokerCard: JokerCard = {
	suit: undefined,
	rank: Ranks.Joker,
};

export interface Card {
	suit: Suits.Any;
	rank: Ranks.Any;
}

export const sort = (cards: Card[]) =>
	cards //
		.sort((a, b) => b.rank.index - a.rank.index)
		.sort((a, b) => a.suit.index - b.suit.index);

export const Pack: Card[] = Suits.All.flatMap(suit => Ranks.All.map((rank): Card => ({ suit, rank })));

export const PackWithJoker: (Card | JokerCard)[] = [...Pack, JokerCard, JokerCard];
