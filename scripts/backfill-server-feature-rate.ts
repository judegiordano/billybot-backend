import { servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await servers.bulkUpdate(
		{
			"settings.feature_rate": { $eq: null }
		},
		{
			"settings.feature_rate": 100
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
