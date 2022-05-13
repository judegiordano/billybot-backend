import { createConnection } from "./connect";

async function main() {
	await createConnection();
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
