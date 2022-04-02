import { Stack, App, StackProps, Api } from "@serverless-stack/resources";

export class ApiStack extends Stack {
	constructor(scope: App, id: string, props?: StackProps) {
		super(scope, id, props);

		const api = new Api(this, "api", {
			cors: {
				allowHeaders: ["Authorization"]
			},
			routes: {
				"$default": "src/handlers/index.run",
			}
		});

		this.addOutputs({
			endpoint: process.env.IS_LOCAL ? api.url : "https://*******/.execute-api.us-east-1.amazonaws.com/api"
		});
	}
}
