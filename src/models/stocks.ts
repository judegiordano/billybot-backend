import type { IStock } from "@interfaces";
import { mongoose } from "@services";
import { stockApiClient } from "@src/services/rest";
import { NotFoundError } from "@src/types/errors";

class Stocks extends mongoose.Repository<IStock> {
	constructor() {
		super("Stock", {
			server_id: {
				type: String,
				index: true,
				required: true
			},
			user_id: {
				type: String,
				index: true,
				required: true
			},
			symbol: {
				type: String,
				index: true,
				required: true
			},
			price: {
				type: Number,
				required: true
			},
			currency: {
				type: String,
				required: true
			},
			amount: {
				type: Number,
				required: true
			},
			is_deleted: {
				type: Boolean,
				default: false
			}
		});
	}

	public async price(symbol: string) {
		try {
			const { data } = await stockApiClient.get(symbol);

			const priceString = (data as string)
				.split(`"${symbol}":{"sourceInterval"`)[1]
				.split("regularMarketPrice")[1]
				// eslint-disable-next-line prettier/prettier
				.split("fmt\":\"")[1]
				// eslint-disable-next-line prettier/prettier
				.split("\"")[0];

			const price = parseFloat(priceString.replace(",", ""));

			const currencyMatch = data.match(/Currency in ([A-Za-z]{3})/);
			const currency = (currencyMatch ? currencyMatch[1] : null) as string;

			return { symbol, price, currency } as IStock;
		} catch (error) {
			throw new NotFoundError(`Stock ticker symbol '${symbol}' not found!`);
		}
	}

	public async priceLookup(symbols: string[]) {
		const prices = await Promise.all(symbols.map((symbol) => this.price(symbol)));
		const dict = prices.reduce((acc, price) => {
			acc[price.symbol] = price.price;
			return acc;
		}, {} as { [key: string]: number });
		return dict;
	}

	public async buy(
		server_id: string,
		user_id: string,
		symbol: string,
		price: number,
		currency: string,
		amount: number
	) {
		const stock = await super.read({ server_id, user_id, symbol, is_deleted: false });
		if (!stock) {
			await super.insertOne({
				server_id,
				user_id,
				symbol,
				price,
				currency,
				amount
			});
			return { symbol, price, currency, amount, add_on: false };
		}

		const avgPrice = parseFloat(
			((stock.price * stock.amount + price * amount) / (stock.amount + amount)).toFixed(2)
		);
		await super.assertUpdateOne(
			{ _id: stock._id },
			{ $inc: { amount: amount }, price: avgPrice }
		);
		return { symbol, price, currency, amount, add_on: true };
	}

	public async sell(stock: IStock, price: number, amount: number) {
		await super.assertUpdateOne({ _id: stock._id }, { is_deleted: true });
		const { symbol, currency } = stock;
		return { symbol, price, currency, amount };
	}

	public getCurrentSellValue(currentPrice: number, originalPrice: number, amount: number) {
		return Math.round(amount * (currentPrice / originalPrice));
	}

	public async portfolio(server_id: string, user_id: string) {
		const stocks = (await super.list({ server_id, user_id, is_deleted: false })) as IStock[];
		if (stocks.length === 0) throw new NotFoundError("No active investments!");
		const symbols = stocks.map(({ symbol }) => symbol);
		const prices = await this.priceLookup(symbols);
		return stocks.map((stock) => {
			const { symbol, price, currency, amount } = stock;
			return {
				symbol,
				price_bought: price,
				price_current: prices[symbol],
				currency,
				amount,
				amount_worth: this.getCurrentSellValue(prices[symbol], price, amount)
			};
		});
	}
}

export const stocks = new Stocks();
