export type OrderStatus = 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export interface OrderItemResponse {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    image: string;
    quantity: number;
}

export interface UserOrderResponse {
    id: string;
    name: string;
    email: string;
}

export interface OrderResponse {
    id: string;
    user: UserOrderResponse;
    status: OrderStatus;
    zip_code: string;
    total: number;
    items: OrderItemResponse[];
    update_at: string;
    created_at: string;
}

export interface PaginatedOrdersResponse {
    data: OrderResponse[];
    page: number;
    limit: number;
    total_rows: number;
    total_pages: number;
}

export interface OrderStatusHistoryResponse {
    id: string;
    status: OrderStatus;
    created_at: string;
}

export interface OrderApiEnvelope<T> {
    "Body:"?: T;
    Body?: T;
    Response: {
        status: number;
        mensagem: string;
    };
}
