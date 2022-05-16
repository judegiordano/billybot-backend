import { servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const updated = await servers.bulkUpdate(
		{
			"settings.birthday_bucks": { $eq: null }
		},
		{
			"settings.birthday_bucks": 500
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
