export const shuffle = <T>(xs: T[]) => xs.sort(() => Math.random() - 0.5);

export const chunk = <T>(arr: T[], size: number) =>
	Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export const split = <T>(arr: T[], size: number) => {
	const ret = new Array<T[]>();
	const len = Math.floor(arr.length / size);
	for (let i = 0; i < size; i++) ret.push(arr.slice(i * len, (i + 1) * len));
	for (let i = 0; i < arr.length % size; i++) ret[i].push(arr.at(-(i + 1))!);
	return ret;
};

export const swap = <T>(arr: T[], a: number, b: number) => {
	const temp = arr[a];
	arr[a] = arr[b];
	arr[b] = temp;
};

export const reorder = <T>(arr: T[], start: number) => arr.slice(start).concat(arr.slice(0, start));

export function exhaustive(_: never): void {}

export function equal<O extends object>(a: O, b: O) {
	for (const key of Object.keys(a)) if (a[key as keyof O] !== b[key as keyof O]) return false;
	return true;
}
