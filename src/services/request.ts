import _ from "lodash";
import { request } from "undici";
import type { HttpMethod, ResponseData } from "undici/types/dispatcher";

import { config } from "@services";
import { InternalServerError } from "@src/types/errors";

type JsonBody = Record<string, any>;
type Params = Record<string, any>;
type Headers = Record<string, any>;
type FormUrlEncoded = Record<string, any>;

type RequestOptions = {
	method?: HttpMethod;
	params?: Params;
	headers?: Headers;
	credentials?: "include" | "omit" | "same-origin";
	body?: JsonBody;
	formBody?: FormUrlEncoded;
};

export class RestApi {
	private baseUrl: string;
	private baseOptions: Partial<RequestOptions>;

	constructor(baseUrl: string, baseOptions?: RequestOptions) {
		this.baseUrl = baseUrl;
		this.baseOptions = {
			body: baseOptions?.body,
			headers: {
				"content-type": "application/json",
				...baseOptions?.headers
			},
			params: baseOptions?.params,
			formBody: baseOptions?.formBody
		};
	}

	private buildBody(options?: RequestOptions) {
		if (options?.body) {
			return JSON.stringify(options.body);
		}
		if (options?.formBody) {
			return new URLSearchParams(options.formBody).toString();
		}
		return null;
	}

	private buildRequest(path?: string, options?: RequestOptions) {
		const combinedOptions = _.merge(this.baseOptions, options);
		const method = combinedOptions?.method ?? "GET";
		const url = new URL(`${this.baseUrl}${path ? `/${path}` : ""}`);
		for (const [key, value] of Object.entries(combinedOptions.params ?? {})) {
			url.searchParams.set(key, value);
		}
		const body = this.buildBody(combinedOptions);
		const headers = combinedOptions.headers;
		return {
			url,
			method,
			headers,
			body
		};
	}

	private async buildResponse<T>(response: ResponseData) {
		const data = response.headers?.["content-type"]?.match("json")
			? await response.body.json()
			: await response.body.text();

		if (response.statusCode >= 400) {
			throw new InternalServerError(data ?? "internal server error");
		}
		return {
			statusCode: response.statusCode,
			headers: response.headers,
			data: data as T
		};
	}

	private async request<T>(path?: string, options?: RequestOptions) {
		const { url, method, headers, body } = this.buildRequest(path, options);
		const response = await request(url, { method, headers, body });
		return this.buildResponse<T>(response);
	}

	public async get<T>(path?: string, options?: RequestOptions) {
		return this.request<T>(path, { ...options, method: "GET" });
	}

	public async post<T>(path?: string, options?: RequestOptions) {
		return this.request<T>(path, { ...options, method: "POST" });
	}

	public async put<T>(path?: string, options?: RequestOptions) {
		return this.request<T>(path, { ...options, method: "PUT" });
	}

	public async patch<T>(path?: string, options?: RequestOptions) {
		return this.request<T>(path, { ...options, method: "PATCH" });
	}

	public async delete<T>(path?: string, options?: RequestOptions) {
		return this.request<T>(path, { ...options, method: "DELETE" });
	}
}

export const discordApi = new RestApi(`${config.DISCORD_API}/v8`);
export const stockApiClient = new RestApi(config.STOCK_API_URL);
export const test = new RestApi("https://jsonplaceholder.typicode.com");
export const factApiClient = new RestApi(config.FACT_URL, { params: { language: "en" } });
