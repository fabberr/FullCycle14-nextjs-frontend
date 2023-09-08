import { Route } from "./models";

export interface ErrorType {
    message: string;
    statusCode: number;
};

interface IRestClient<TResponseData> {
    create(body: {}): Promise<TResponseData | ErrorType>;
    find(query?: string): Promise<TResponseData | ErrorType>;
    get(id: string): Promise<TResponseData | ErrorType>;
    update(id: string): Promise<TResponseData | ErrorType>;
    delete(id: string): Promise<TResponseData | ErrorType>;
};

abstract class RestClient<TResponseData> implements IRestClient<TResponseData> {
    protected static readonly BASE_URL: string = process.env.NEXT_PUBLIC_INTERNAL_API_BASE_URL as string;
    protected abstract _resource: string;

    public abstract create(body: {}): Promise<TResponseData | ErrorType>;
    public abstract find(query?: string): Promise<TResponseData | ErrorType>;
    public abstract get(id: string): Promise<TResponseData | ErrorType>;
    public abstract update(id: string): Promise<TResponseData | ErrorType>;
    public abstract delete(id: string): Promise<TResponseData | ErrorType>;

    protected async fetch(url: string, init?: RequestInit): Promise<TResponseData | ErrorType>{
        return fetch(url, init).then((res) => res.json() as TResponseData);
    }
};

export class RoutesClient extends RestClient<Route> {
    private static _instance: RoutesClient | null = null;
    protected _resource: string = 'routes';

    private constructor() { super(); }

    public static readonly instance = (() => RoutesClient._instance ?? (RoutesClient._instance = new RoutesClient()))();

    public create(body: {}): Promise<Route | ErrorType> {
        throw new Error("Method not implemented.");
    }

    public find(query?: string | undefined): Promise<Route | ErrorType> {
        throw new Error("Method not implemented.");
    }

    public get(id: string): Promise<Route | ErrorType> {
        return this.fetch(`${RestClient.BASE_URL}/${this._resource}/${id}`);
    }

    public update(id: string): Promise<Route | ErrorType> {
        throw new Error("Method not implemented.");
    }

    public delete(id: string): Promise<Route | ErrorType> {
        throw new Error("Method not implemented.");
    }
}
