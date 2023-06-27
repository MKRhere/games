export interface Rank {
	sym: string;
	name: string;
	index: number;
}

export const Two = {
	sym: "2",
	name: "Two",
	index: 0,
} as const satisfies Rank;

export const Three = {
	sym: "3",
	name: "Three",
	index: 1,
} as const satisfies Rank;

export const Four = {
	sym: "4",
	name: "Four",
	index: 2,
} as const satisfies Rank;

export const Five = {
	sym: "5",
	name: "Five",
	index: 3,
} as const satisfies Rank;

export const Six = {
	sym: "6",
	name: "Six",
	index: 4,
} as const satisfies Rank;

export const Seven = {
	sym: "7",
	name: "Seven",
	index: 5,
} as const satisfies Rank;

export const Eight = {
	sym: "8",
	name: "Eight",
	index: 6,
} as const satisfies Rank;

export const Nine = {
	sym: "9",
	name: "Nine",
	index: 7,
} as const satisfies Rank;

export const Jack = {
	sym: "J",
	name: "Jack",
	index: 8,
} as const satisfies Rank;

export const Queen = {
	sym: "Q",
	name: "Queen",
	index: 9,
} as const satisfies Rank;

export const King = {
	sym: "K",
	name: "King",
	index: 10,
} as const satisfies Rank;

export const Ace = {
	sym: "A",
	name: "Ace",
	index: 11,
} as const satisfies Rank;

export const Joker = {
	sym: "🃏",
	name: "Joker",
	index: -1,
} as const satisfies Rank;

export const All = [Two, Three, Four, Five, Six, Seven, Eight, Nine, Jack, Queen, King, Ace];

export type Any = (typeof All)[number];
