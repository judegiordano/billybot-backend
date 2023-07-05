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

		const openaiBucket = new Bucket(this, "openai", {
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

		// new Cron(this, "fun-fact-cron", {
		// 	// fires at 2:00pm daily (UTC -> EST)
		// 	schedule: "cron(0 18 * * ? *)",
		// 	job: {
		// 		function: {
		// 			handler: "src/handlers/cron.funFact"
		// 		}
		// 	}
		// });

		new Cron(this, "role-update-cron", {
			// fires every 1 min
			schedule: "rate(1 minute)",
			job: {
				function: {
					handler: "src/handlers/cron.roleUpdate"
				}
			}
		});

		const api = new Api(this, "api", {
			routes: {
				$default: "src/handlers/index.run"
			},
			defaults: {
				function: {
					permissions: [notificationQueue, openaiBucket],
					environment: {
						MEDIA_BUCKET: mediaBucket.bucketName,
						OPENAI_BUCKET: openaiBucket.bucketName
					}
				}
			}
		});
		api.attachPermissions(["s3"]);

		new Function(this, "create-token", {
			handler: "src/handlers/functions.createToken"
		});

		this.addOutputs({
			endpoint: process.env.IS_LOCAL
				? api.url
				: "https://*******/.execute-api.us-east-1.amazonaws.com/api/v*/",
			mediaBucket: process.env.IS_LOCAL ? mediaBucket.bucketName : "*******",
			openaiBucket: process.env.IS_LOCAL ? openaiBucket.bucketName : "*******"
		});

		// expose envs to lambdas
		const functions = this.getAllFunctions();
		functions.map((fn) => {
			fn.addEnvironment("API_URL", api.url);
			fn.addEnvironment("NOTIFICATION_QUEUE", notificationQueue.cdk.queue.queueUrl);
			fn.addEnvironment("REFRESH_TOKEN_QUEUE", tokenQueue.cdk.queue.queueUrl);
		});
	}
}
