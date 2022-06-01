// app info
export const IS_LOCAL = process.env.IS_LOCAL ? true : false;
export const STAGE = process.env.STAGE as string;
export const VERSION = process.env.VERSION as string;
export const REGION = process.env.REGION as string;
// secrets
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET as string;
// resources
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET as string;
// static urls
export const DISCORD_API = "https://discord.com/api/v8";
export const STOCK_API_URL = "https://finance.yahoo.com/quote";
export const DASHBOARD_URL = IS_LOCAL ? "http://localhost:3000" : "https://billybot.vercel.app";
export const DASHBOARD_DOMAIN = IS_LOCAL ? "localhost" : "billybot.vercel.app";
export const API_URL = `${process.env.API_URL}/api/v${VERSION}`;
