// Опис структури самого замовлення (те, що ми відправляємо і отримуємо)
export interface Order {
  id?: number;
  latitude: number;
  longitude: number;
  subtotal: number;
  // Додаємо поля, на які зараз "свариться" форма:
  composite_tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
}

// Опис відповіді при завантаженні CSV (те, що ти вже знайшла)
export interface ImportCSVResponse {
  total_processed: number;
  success_count: number;
  error_count: number;
  errors: {
    row: number;
    reason: string;
  }[];
}