import { challenges } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const updated = await challenges.bulkUpdate(
		{ is_betting_active: { $eq: null } },
		{ is_betting_active: false }
	);
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
