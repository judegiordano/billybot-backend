import { Stack, App, StackProps, Api, Function, Cron } from "@serverless-stack/resources";

export class ApiStack extends Stack {
	constructor(scope: App, id: string, props?: StackProps) {
		super(scope, id, props);

		new Cron(this, "lottery-cron", {
			// fires at 12:00pm FRI (UTC -> EST)
			schedule: "cron(0 17 ? * FRI *)",
			job: "src/handlers/cron.pickLotteryWinner",
		});

		const api = new Api(this, "api", {
			defaultThrottlingRateLimit: 2000,
			defaultThrottlingBurstLimit: 100,
			cors: {
				allowHeaders: ["Authorization", "x-api-timestamp"]
			},
			routes: {
				"$default": "src/handlers/index.run",
			}
		});

		new Function(this, "create-token", {
			handler: "src/handlers/functions.createToken",
		});

		this.addOutputs({
			endpoint: process.env.IS_LOCAL ? api.url : "https://*******/.execute-api.us-east-1.amazonaws.com/api/v*/"
		});
	}
}
