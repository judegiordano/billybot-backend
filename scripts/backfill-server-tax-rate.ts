import { servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await servers.bulkUpdate(
		{
			"settings.tax_rate": { $eq: null }
		},
		{
			"settings.tax_rate": 20
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
