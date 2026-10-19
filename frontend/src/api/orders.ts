import { buildQuery, request } from "./client";
import type { Order, OrderListResponse, OrderPayload, OrderStatus } from "../types";

export function createOrder(payload: OrderPayload): Promise<Order> {
  return request<Order>("/orders/", { method: "POST", body: payload });
}

export function getOrders(
  query: { page?: number; limit?: number; status?: OrderStatus | null } = {},
  signal?: AbortSignal,
): Promise<OrderListResponse> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    status: query.status,
  });

  return request<OrderListResponse>(`/orders/${qs}`, { auth: true, signal });
}

export function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, {
    method: "PUT",
    body: { status },
    auth: true,
  });
}
