import { Stack, App, StackProps, Api, Function, Cron, Bucket } from "@serverless-stack/resources";

export class ApiStack extends Stack {

	constructor(scope: App, id: string, props?: StackProps) {
		super(scope, id, props);

		const mediaBucket = new Bucket(this, "media", {
			s3Bucket: {
				publicReadAccess: true
			}
		});

		new Cron(this, "lottery-cron", {
			// fires at 12:00pm FRI (UTC -> EST)
			schedule: "cron(0 16 ? * FRI *)",
			job: "src/handlers/cron.pickLotteryWinner"
		});

		new Cron(this, "birthday-cron", {
			// fires at 10:00am MON-FRI (UTC -> EST)
			schedule: "cron(0 14 * * ? *)",
			job: "src/handlers/cron.happyBirthday"
		});

		new Cron(this, "good-morning-cron", {
			// fires at 9:00am MON (UTC -> EST)
			schedule: "cron(0 13 ? * MON *)",
			job: {
				function: {
					handler: "src/handlers/cron.goodMorning",
					permissions: [mediaBucket],
					environment: {
						MEDIA_BUCKET: mediaBucket.bucketName
					}
				}
			}
		});

		const api = new Api(this, "api", {
			defaultThrottlingRateLimit: 2000,
			defaultThrottlingBurstLimit: 100,
			cors: {
				allowOrigins: ["*"],
				allowHeaders: ["Authorization", "x-api-timestamp"]
			},
			routes: {
				"$default": "src/handlers/index.run",
			}
		});

		new Function(this, "create-token", {
			handler: "src/handlers/functions.createToken"
		});

		this.addOutputs({
			endpoint: process.env.IS_LOCAL ? api.url : "https://*******/.execute-api.us-east-1.amazonaws.com/api/v*/"
		});
	}
}
