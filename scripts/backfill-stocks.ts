import type { IStock } from "btbot-types";

import { stocks } from "../src/models";
import { createConnection } from "./connect";

const backFill = [] as IStock[];

export async function main() {
	await createConnection();
	const operations = backFill.reduce((acc, stock) => {
		if (!stock) return acc;
		acc.push(stocks.insertOne(stock));
		return acc;
	}, [] as Promise<IStock | null>[]);
	const done = await Promise.all(operations);
	console.log(done.length);
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
