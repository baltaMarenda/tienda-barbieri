import { request } from "./client";
import type { TokenResponse, User } from "../types";

export function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe(signal?: AbortSignal): Promise<User> {
  return request<User>("/users/me", { auth: true, signal });
}
