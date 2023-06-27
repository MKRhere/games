export interface Suit {
	sym: string;
	name: string;
	index: number;
}

export const Spades = {
	sym: "♠️",
	name: "Spades",
	index: 0,
} as const satisfies Suit;

export const Hearts = {
	sym: "♥️",
	name: "Hearts",
	index: 1,
} as const satisfies Suit;

export const Clubs = {
	sym: "♣️",
	name: "Clubs",
	index: 2,
} as const satisfies Suit;

export const Diamonds = {
	sym: "♦️",
	name: "Diamonds",
	index: 3,
} as const satisfies Suit;

export const All = [Spades, Hearts, Clubs, Diamonds];

export type Any = (typeof All)[number];
