import { apiClient } from "../../../shared/api/apiClient";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./authTypes";

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", request);
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", request);
}