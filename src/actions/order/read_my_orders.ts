import ApiUrlBase from '../api';
import { PaginatedOrdersResponse, OrderApiEnvelope } from '@/src/types/order';

export interface ReadMyOrdersParams {
    page?: number;
    limit?: number;
    status?: string;
}

export default async function ReadMyOrdersService({
    page = 1,
    limit = 10,
    status = '',
}: ReadMyOrdersParams = {}): Promise<PaginatedOrdersResponse> {
    const baseUrl = ApiUrlBase();

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (status) {
        params.append('status', status.toUpperCase());
    }

    const res = await fetch(`${baseUrl}/orders/me?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (res.status === 401) {
        throw new Error('401');
    }

    if (!res.ok) {
        throw new Error('Erro ao listar pedidos.');
    }

    const json = (await res.json()) as OrderApiEnvelope<PaginatedOrdersResponse>;
    const body = json['Body:'] ?? json.Body;

    if (!body) {
        return {
            data: [],
            page,
            limit,
            total_rows: 0,
            total_pages: 0,
        };
    }

    return {
        ...body,
        data: body.data ?? [],
    };
}
