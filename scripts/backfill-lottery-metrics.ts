import { users } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const done = await users.bulkUpdate(
		{
			"metrics.lottery": { $eq: null }
		},
		{
			"metrics.lottery": {
				overall_winnings: 0,
				tickets_purchased: 0,
				wins: 0
			}
		}
	);
	console.log({ done });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
