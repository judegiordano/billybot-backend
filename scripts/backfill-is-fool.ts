import { createConnection } from "./connect";

import { users } from "../src/models";

async function main() {
	await createConnection();
	const updated = await users.bulkUpdate({ is_fool: { $eq: null } }, { is_fool: false });
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
