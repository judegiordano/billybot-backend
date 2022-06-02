import { servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await servers.bulkUpdate(
		{
			"settings.challenge_bet_max": { $eq: null }
		},
		{
			"settings.challenge_bet_max": 1000
		}
	);
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
