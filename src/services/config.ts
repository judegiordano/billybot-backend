// app info
export const STAGE = process.env.STAGE as string;
export const VERSION = process.env.VERSION as string;
export const LAMBDA_HASH = process.env.LAMBDA_HASH as string;
export const LAMBDA_REGION = process.env.LAMBDA_REGION as string;
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET as string;
// secrets
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;
// static urls
export const DASHBOARD_URL = "https://billybot.vercel.app/server";
export const STOCK_API_URL = "https://finance.yahoo.com/quote";
export const DISCORD_API = "https://discord.com/api/v8";
export const DISCORD_WEBHOOKS_URL = `${DISCORD_API}/webhooks`;
export const DISCORD_OAUTH_URL = `${DISCORD_API}/oauth2`;
