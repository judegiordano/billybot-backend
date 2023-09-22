import { type SSTConfig } from "sst";
import { type StackContext, Function, Bucket, Cron, Queue } from "sst/constructs";

function ApiStackV2({ stack }: StackContext) {
	const mediaBucket = new Bucket(stack, "media", {
		cdk: {
			bucket: {
				publicReadAccess: true
			}
		}
	});
	const openaiBucket = new Bucket(stack, "openai", {
		cdk: {
			bucket: {
				publicReadAccess: true
			}
		}
	});

	const tokenQueue = new Queue(stack, "refresh-token-queue", {
		consumer: "src/handlers/queue.refreshTokenConsumer",
		cdk: {
			queue: {
				fifo: true
			}
		}
	});
	const notificationQueue = new Queue(stack, "email-notification-queue", {
		consumer: "src/handlers/queue.notificationQueueConsumer",
		cdk: {
			queue: {
				fifo: true
			}
		}
	});

	new Cron(stack, "lottery-cron", {
		// fires at 12:00pm FRI (UTC -> EST)
		schedule: "cron(0 16 ? * FRI *)",
		job: "src/handlers/cron.pickLotteryWinner"
	});
	new Cron(stack, "house-cleaning-cron", {
		// fires at 10:00am FRI (UTC -> EST)
		schedule: "cron(0 14 ? * FRI *)",
		job: "src/handlers/cron.houseCleaning"
	});
	new Cron(stack, "birthday-cron", {
		// fires every day at 10:00am (UTC -> EST)
		schedule: "cron(0 14 * * ? *)",
		job: "src/handlers/cron.happyBirthday"
	});
	new Cron(stack, "refresh-oauth", {
		// fires every 5 days
		schedule: "rate(5 days)",
		job: "src/handlers/cron.refreshOauthTokens"
	});
	new Cron(stack, "role-update-cron", {
		// fires every 1 min
		schedule: "rate(1 minute)",
		job: "src/handlers/cron.roleUpdate"
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

	const api = new Function(stack, "api", {
		handler: "src/handlers/index.run",
		url: { cors: true }
	});
	new Function(stack, "create-token", {
		handler: "src/handlers/functions.createToken"
	});

	const functions = stack.getAllFunctions();
	functions.map((fn) => {
		fn.addEnvironment("API_URL", api.url as string);
		fn.addEnvironment("NOTIFICATION_QUEUE", notificationQueue.cdk.queue.queueUrl);
		fn.addEnvironment("REFRESH_TOKEN_QUEUE", tokenQueue.cdk.queue.queueUrl);
		fn.addEnvironment("MEDIA_BUCKET", mediaBucket.bucketName);
		fn.addEnvironment("OPENAI_BUCKET", openaiBucket.bucketName);
		fn.attachPermissions(["s3", "sqs"]);
	});
	stack.addOutputs({
		endpoint: process.env.IS_LOCAL
			? api.url
			: `https://*******/.lambda-url.${stack.region}.on.aws/api`
	});
}

const config: SSTConfig = {
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	config(_input) {
		return {
			name: "billybot-backend",
			region: "us-east-1"
		};
	},
	stacks(app) {
		app.setDefaultFunctionProps({
			runtime: "nodejs18.x",
			architecture: "arm_64",
			memorySize: "2048 MB",
			timeout: 30,
			logRetention: "one_week",
			environment: {
				STAGE: app.stage,
				REGION: app.region,
				JWT_SECRET: process.env.JWT_SECRET ?? "secret",
				MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/billybot-api-local",
				EMAIL: process.env.EMAIL ?? "billybot.alerts@gmail.com",
				SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ?? "xxxxxxxxxxxx",
				VERSION: process.env.VERSION ?? "2",
				DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "client_id",
				DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? "client_secret",
				OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "xxxxxxxxxxxx",
				STOCK_API_KEY: process.env.STOCK_API_KEY ?? "xxxxxxxxxxxx",
				BOT_TOKEN: process.env.BOT_TOKEN ?? "xxxxxxxxxxxx"
			}
		});
		app.stack(ApiStackV2);
	}
};

export default config;
