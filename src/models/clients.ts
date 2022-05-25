import type { IModel } from "btbot-types";

import { mongoose, password } from "@services";
import { BadRequestError, UnauthorizedError } from "@src/types";

enum ClientElevation {
	user = "user",
	admin = "admin"
}

// this is a transient interface, used to track current login
interface ClientAuthState {
	user_id?: string;
	username?: string;
	discriminator?: string;
	avatar?: string;
	access_token?: string;
	refresh_token?: string;
}

export interface IClient extends IModel {
	email: string;
	username: string;
	password: string;
	elevation: ClientElevation;
	token_version: number;
	auth_state?: ClientAuthState;
}

class Clients extends mongoose.Repository<IClient> {
	constructor() {
		super("Client", {
			email: {
				type: String,
				index: true,
				required: true
			},
			username: {
				type: String,
				index: true,
				required: true
			},
			password: {
				type: String,
				required: true
			},
			elevation: {
				type: String,
				enum: Object.values(ClientElevation),
				default: ClientElevation.user
			},
			token_version: {
				type: Number,
				default: 0
			},
			auth_state: {
				_id: false,
				required: false,
				user_id: {
					type: String,
					required: false
				},
				username: {
					type: String,
					required: false
				},
				discriminator: {
					type: String,
					required: false
				},
				avatar: {
					type: String,
					required: false
				},
				access_token: {
					type: String,
					required: false
				},
				refresh_token: {
					type: String,
					required: false
				}
			}
		});
	}

	public async assertNewClient({ username, email }: IClient) {
		// TODO: perform stricter checks
		const emailTaken = await clients.exists({ email });
		if (emailTaken) throw new BadRequestError("email taken");
		const userNameTaken = await clients.exists({ username });
		if (userNameTaken) throw new BadRequestError("username taken");
	}

	public async register(client: IClient) {
		await this.assertNewClient(client);
		const hash = await password.hashPassword(client.password);
		return super.insertOne({ ...client, password: hash });
	}

	public async login({ username, password: pass }: IClient) {
		const found = await super.read({ username });
		if (!found) throw new UnauthorizedError("username not found");
		const match = await password.comparePassword(pass, found.password);
		if (!match) throw new UnauthorizedError("incorrect password");
		return found;
	}
}

export const clients = new Clients();
