import { Telegraf, Input } from "telegraf";

const bot = new Telegraf("");

const stickers: Record<string, Record<string, { file: string; file_id: string }>> = {
	red: {
		1: { file: "./stickers/abcde.webp", file_id: "" },
	},
};

for (const group of Object.keys(stickers)) {
	for (const num in Object.keys(stickers[group])) {
		const sticker = stickers[group][num];
		const msg = await bot.telegram.sendSticker(55000824, Input.fromLocalFile(sticker.file));
		sticker.file_id = msg.sticker.file_id;
	}
}

console.log(JSON.stringify(stickers, null, "\t"));
