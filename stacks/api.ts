import {
	Stack,
	App,
	StackProps,
	Api,
	Function,
	Cron,
	Bucket,
	Queue
} from "@serverless-stack/resources";

export class ApiStack extends Stack {
	constructor(scope: App, id: string, props?: StackProps) {
		super(scope, id, props);

		const mediaBucket = new Bucket(this, "media", {
			cdk: {
				bucket: {
					publicReadAccess: true
				}
			}
		});

		const tokenQueue = new Queue(this, "refresh-token-queue", {
			consumer: "src/handlers/queue.refreshTokenConsumer",
			cdk: {
				queue: {
					fifo: true
				}
			}
		});

		const notificationQueue = new Queue(this, "email-notification-queue", {
			consumer: "src/handlers/queue.notificationQueueConsumer",
			cdk: {
				queue: {
					fifo: true
				}
			}
		});

		new Cron(this, "lottery-cron", {
			// fires at 12:00pm FRI (UTC -> EST)
			schedule: "cron(0 16 ? * FRI *)",
			job: "src/handlers/cron.pickLotteryWinner"
		});

		new Cron(this, "house-cleaning-cron", {
			// fires at 10:00am FRI (UTC -> EST)
			schedule: "cron(0 14 ? * FRI *)",
			job: "src/handlers/cron.houseCleaning"
		});

		new Cron(this, "birthday-cron", {
			// fires every day at 10:00am (UTC -> EST)
			schedule: "cron(0 14 * * ? *)",
			job: "src/handlers/cron.happyBirthday"
		});

		new Cron(this, "refresh-oauth", {
			// fires every 5 days
			schedule: "rate(5 days)",
			job: {
				function: {
					handler: "src/handlers/cron.refreshOauthTokens",
					permissions: [tokenQueue],
					environment: {
						REFRESH_TOKEN_QUEUE: tokenQueue.cdk.queue.queueUrl
					}
				}
			}
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
			routes: {
				$default: "src/handlers/index.run"
			},
			defaults: {
				function: {
					permissions: [notificationQueue],
					environment: {
						MEDIA_BUCKET: mediaBucket.bucketName
					}
				}
			}
		});

		new Function(this, "create-token", {
			handler: "src/handlers/functions.createToken"
		});

		this.addOutputs({
			endpoint: process.env.IS_LOCAL
				? api.url
				: "https://*******/.execute-api.us-east-1.amazonaws.com/api/v*/",
			bucket: process.env.IS_LOCAL ? mediaBucket.bucketName : "*******"
		});

		// expose envs to lambdas
		const functions = this.getAllFunctions();
		functions.map((fn) => {
			fn.addEnvironment("API_URL", api.url);
			fn.addEnvironment("NOTIFICATION_QUEUE", notificationQueue.cdk.queue.queueUrl);
		});
	}
}
