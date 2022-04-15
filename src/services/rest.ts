import axios from "axios";

export const webhooks = axios.create({
	baseURL: "https://discord.com/api/v8/webhooks"
});
