import fs from "fs";

import { users } from "../src/models";
import { createConnection } from "./connect";

async function main() {
	await createConnection();
	const found = await users.assertList();
	found.map((user) => {
		const normalized = {
			billy_bucks: user.billy_bucks,
			server_id: user.server_id,
			user_id: user.user_id,
			username: user.username,
			discriminator: user.discriminator,
			avatar_hash: user.avatar_hash,
			allowance_available: user.allowance_available,
			has_lottery_ticket: user.has_lottery_ticket,
			is_admin: user.is_admin,
			is_mayor: user.is_mayor,
			metrics: user.metrics,
			...(user.birthday ? { birthday: user.birthday } : null)
		};
		fs.appendFileSync("users.json", `${JSON.stringify(normalized)},`);
	});
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
