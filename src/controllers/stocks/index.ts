import type { FastifyInstance } from "fastify";
import type { IStock } from "btbot-types";

import { servers, stocks, users } from "@models";
import { BadRequestError, NotFoundError } from "@src/types/errors";

export const stocksRouter = async function (app: FastifyInstance) {
	app.get<{
		Querystring: {
			symbol: string;
		};
	}>(
		"/stocks/price",
		{
			schema: {
				querystring: {
					type: "object",
					required: ["symbol"],
					additionalProperties: false,
					properties: {
						symbol: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							symbol: { type: "string" },
							price: { type: "number" },
							currency: { type: "string" }
						}
					}
				}
			}
		},
		async (req) => {
			const { symbol } = req.query;
			if (!symbol)
				throw new BadRequestError(
					"Must specify a valid ticker symbol!\n\nExample: `!stock CRM`"
				);
			return await stocks.price(symbol.toUpperCase());
		}
	);
	app.post<{ Body: IStock }>(
		"/stocks/buy",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						symbol: { type: "string" },
						amount: { type: "number", minimum: 1 }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							symbol: { type: "string" },
							price: { type: "number" },
							currency: { type: "string" },
							amount: { type: "number" },
							add_on: { type: "boolean" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, symbol, amount } = req.body;
			if (!symbol || !amount)
				throw new BadRequestError(
					"Must specify a valid ticker symbol and amount of BillyBucks!\n\nExample: `!buystock CRM 100`"
				);
			await servers.assertExists({ server_id });
			await users.assertHasBucks(user_id, server_id, amount);
			const { price, currency } = await stocks.price(symbol.toUpperCase());
			const [buy] = await Promise.all([
				stocks.buy(server_id, user_id, symbol.toUpperCase(), price, currency, amount),
				users.assertUpdateOne({ server_id, user_id }, { $inc: { billy_bucks: -amount } })
			]);
			return buy;
		}
	);
	app.post<{ Body: IStock }>(
		"/stocks/sell",
		{
			preValidation: [app.restricted],
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" },
						symbol: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							symbol: { type: "string" },
							price: { type: "number" },
							currency: { type: "string" },
							amount: { type: "number" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id, symbol } = req.body;
			if (!symbol)
				throw new BadRequestError(
					"Must specify a valid ticker symbol that you own stock in!\n\nExample: `!sellstock CRM`"
				);
			await servers.assertExists({ server_id });
			await users.assertExists({ server_id, user_id });
			const stock = await stocks.read({
				server_id,
				user_id,
				symbol: symbol.toUpperCase(),
				is_deleted: false
			});
			if (!stock)
				throw new NotFoundError(`You do not own any stock in '${symbol.toUpperCase()}'!`);
			const { price } = await stocks.price(symbol.toUpperCase());
			const sellValue = stocks.getCurrentSellValue(price, stock.price, stock.amount);
			const [sell] = await Promise.all([
				stocks.sell(stock, price, sellValue),
				users.assertUpdateOne({ server_id, user_id }, { $inc: { billy_bucks: sellValue } })
			]);
			return sell;
		}
	);
	app.post<{ Body: IStock }>(
		"/stocks/portfolio",
		{
			schema: {
				body: {
					type: "object",
					required: ["server_id", "user_id"],
					additionalProperties: false,
					properties: {
						server_id: { type: "string" },
						user_id: { type: "string" }
					}
				},
				response: {
					200: {
						type: "object",
						properties: {
							stocks: {
								type: "array",
								items: {
									type: "object",
									properties: {
										symbol: { type: "string" },
										price_bought: { type: "number" },
										price_current: { type: "number" },
										currency: { type: "string" },
										amount: { type: "number" },
										amount_worth: { type: "number" }
									}
								}
							},
							bucks: { type: "number" }
						}
					}
				}
			}
		},
		async (req) => {
			const { server_id, user_id } = req.body;
			await servers.assertExists({ server_id });
			const user = await users.assertRead({ user_id, server_id });
			const stockList = await stocks.portfolio(server_id, user_id);
			return { stocks: stockList, bucks: user.billy_bucks };
		}
	);
};
