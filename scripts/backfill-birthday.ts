import type { IUser } from "btbot-types";

import { users } from "../src/models";
import { createConnection } from "./connect";

const backFill = [];

export async function main() {
	await createConnection();
	const operations = backFill.reduce((acc, { _id, birthday }) => {
		if (!birthday) return acc;
		acc.push(users.updateOne({ _id }, { birthday: new Date(birthday).toISOString() }));
		return acc;
	}, [] as Promise<IUser | null>[]);
	const done = await Promise.all(operations);
	console.log(done.length);
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
