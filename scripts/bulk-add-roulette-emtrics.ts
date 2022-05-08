import { users } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await users.bulkUpdate({ "metrics.gambling": { $eq: null } }, {
		"metrics.gambling": {
			roulette: {
				spins: 0,
				red_spins: 0,
				black_spins: 0,
				green_spins: 0,
				wins: 0,
				losses: 0,
				overall_winnings: 0,
				overall_losings: 0,
			}
		}
	});
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
