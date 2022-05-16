import { users } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const found = await users.list({ "metrics.gambling.blackjack": { $eq: null } });
	if (found.length <= 0) return;
	const operations = found.map((user) => {
		return users.updateOne(
			{ _id: user._id },
			{
				"metrics.gambling.blackjack": {
					games: 0,
					wins: 0,
					losses: 0,
					double_downs: 0,
					overall_winnings: 0,
					overall_losings: 0,
					last_hand: null
				}
			}
		);
	});
	await Promise.all(operations);
	console.log("done");
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
