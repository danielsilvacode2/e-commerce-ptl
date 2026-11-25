import ApiUrlBase from '../api';
import { PaginatedOrdersResponse, OrderApiEnvelope } from '@/src/types/order';

export interface AdminReadAllOrdersParams {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    signal?: AbortSignal;
}

export default async function AdminReadAllOrdersService({
    page = 1,
    limit = 10,
    status = '',
    userId = '',
    signal,
}: AdminReadAllOrdersParams = {}): Promise<PaginatedOrdersResponse> {
    const baseUrl = ApiUrlBase();

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (status) {
        params.append('status', status.toUpperCase());
    }

    if (userId) {
        params.append('user_id', userId);
    }

    const res = await fetch(`${baseUrl}/orders?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        signal,
    });

    if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso negado. Perfil de administrador necessário.');
    }

    if (!res.ok) {
        throw new Error('Erro ao buscar pedidos no painel.');
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
