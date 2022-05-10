import { webhooks, servers } from "../src/models";
import { createConnection } from "./connect";

export async function main() {
	await createConnection();
	const serverList = await servers.assertList();
	const operations = serverList.reduce((acc, server) => {
		acc.push(webhooks.bulkUpdate({ server: { $eq: null } }, { server: server._id }));
		return acc;
	}, [] as Promise<unknown>[]);
	const updated = await Promise.all(operations);
	console.log({ updated });
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
