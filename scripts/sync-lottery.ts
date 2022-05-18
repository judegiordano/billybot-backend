import { users } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const done = await users.bulkUpdate(
		{
			has_lottery_ticket: true
		},
		{
			$inc: {
				"metrics.lottery.tickets_purchased": 1
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
