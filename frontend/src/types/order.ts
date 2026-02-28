export interface TaxBreakdown {
  state_rate: number;
  county_rate: number;
  city_rate: number;
  special_rates: number;
}

export interface Order {
  id?: string; // Змінили на string, бо бекенд тепер генерує UUID
  latitude: number;
  longitude: number;
  subtotal: number;
  composite_tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
  breakdown?: TaxBreakdown;  // Додали нове поле
  jurisdictions?: string[];  // Додали нове поле
}

export interface ImportCSVResponse {
  total_processed: number;
  success_count: number;
  error_count: number;
  errors: {
    row: number;
    reason: string;
  }[];
}
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiError {
  detail: string | ValidationError[]; // FastAPI повертає або рядок, або масив деталей
}
// src/types/order.ts
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;       // JWT-токен
  expires_in?: number; // необов'язково, якщо бекенд віддає час життя токена
  user?: {
    id: string;
    email: string;
    name?: string;
  };}