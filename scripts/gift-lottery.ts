import { users } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await users.bulkUpdate(
		{ has_lottery_ticket: false },
		{ has_lottery_ticket: true }
	);
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
