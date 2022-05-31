import { users } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const done = await users.bulkUpdate(
		{
			"metrics.gambling.challenges": { $eq: null }
		},
		{
			"metrics.gambling.challenges": {
				bets: 0,
				wins: 0,
				losses: 0,
				overall_winnings: 0,
				overall_losses: 0
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
