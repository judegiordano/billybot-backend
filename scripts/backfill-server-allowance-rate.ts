import { servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await servers.bulkUpdate(
		{
			"settings.allowance_rate": { $eq: null }
		},
		{
			"settings.allowance_rate": 200
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
