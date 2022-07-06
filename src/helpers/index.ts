import Chance from "chance";
import type { IUser } from "btbot-types";
import { customAlphabet } from "nanoid";

export function buildAvatarUrl(user: IUser) {
	if (!user.avatar_hash) return "https://discord.com/assets/c09a43a372ba81e3018c3151d4ed4773.png";
	return `https://cdn.discordapp.com/avatars/${user.user_id}/${user.avatar_hash}.png`;
}

export function readableDate(date: Date) {
	const readableDay = date.toLocaleDateString();
	const readableTime = date.toLocaleTimeString();
	return `${readableDay} ${readableTime}`;
}

export function diffInDays(date1: Date, date2: Date) {
	const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
	const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
	const diff = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
	return diff;
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 20);

export const chance = new Chance();

export {
	spinColor,
	getRouletteResult,
	buildBlackJackMetrics,
	buildConnectFourMetrics
} from "./gambling";
export { renderTemplate } from "./email-templates";
