import { servers, IServer } from "../models";
import { mongoose } from "../services";

class Servers extends mongoose.Repository<IServer> {
	constructor() {
		super(servers.modelName);
	}
}

export const serverRepo = new Servers();
