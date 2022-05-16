import { connect } from "mongoose";

import { MONGO_URI } from "../src/services/config";

export async function createConnection() {
	await connect(MONGO_URI, {
		autoCreate: true,
		autoIndex: true,
		keepAlive: true,
		maxIdleTimeMS: 3000,
		socketTimeoutMS: 30000,
		serverSelectionTimeoutMS: 5000,
		maxPoolSize: 5
	});
}
