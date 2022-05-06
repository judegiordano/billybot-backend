import { users } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await users.bulkUpdate({ is_mayor: { $eq: null } }, { is_mayor: false });
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
