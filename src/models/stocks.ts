import axios from "axios";

import { users } from "./user";
import type { IStock } from "@interfaces";
import { mongoose } from "@services";
import { STOCK_API_URL } from "@src/types/values";

class Stocks extends mongoose.Repository<IStock> {
	private static readonly stockApiClient = axios.create({
		baseURL: STOCK_API_URL
	});

	constructor() {
		super("Stock", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user: {
				type: String,
				ref: users.model.modelName,
				index: true,
				required: true
			},
			symbol: {
				type: String,
				index: true
			},
			price: {
				type: Number
			},
			currency: {
				type: String
			}
		});
	}

	public async getPrice(symbol: string): Promise<IStock> {
		try {
			const { data } = await Stocks.stockApiClient.get(symbol);

			const priceString: string = data
				.split(`"${symbol}":{"sourceInterval"`)[1]
				.split("regularMarketPrice")[1]
				// eslint-disable-next-line prettier/prettier
				.split("fmt\":\"")[1]
				// eslint-disable-next-line prettier/prettier
				.split("\"")[0];

			const price = parseFloat(priceString.replace(",", ""));

			const currencyMatch = data.match(/Currency in ([A-Za-z]{3})/);
			const currency: string = currencyMatch ? currencyMatch[1] : null;

			return { symbol, price, currency } as IStock;
		} catch (error: unknown) {
			throw "Stock not found!";
		}
	}
}

export const stocks = new Stocks();
