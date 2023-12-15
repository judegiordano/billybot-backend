import { createConnection } from "./connect";

import { users } from "../src/models";

async function main() {
	await createConnection();
	const updated = await users.bulkUpdate(
		{ is_deal_or_no_deal_eligible: { $eq: null } },
		{ is_deal_or_no_deal_eligible: true }
	);
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
