/**
 * Деталізація податкових ставок за різними рівнями юрисдикцій.
 */
export interface TaxBreakdown {
  state_rate: number;
  county_rate: number;
  city_rate: number;
  special_rates: number;
}

/**
 * Модель замовлення.
 * Містить базові дані (координати, суму) та розраховані податкові показники від сервера.
 */
export interface Order {
  /** Унікальний ідентифікатор замовлення (UUID). */
  id?: string;
  latitude: number;
  longitude: number;
  subtotal: number;
  /** Загальна складена податкова ставка (наприклад, 0.08875 для 8.875%). */
  composite_tax_rate?: number;
  /** Розрахована сума податку. */
  tax_amount?: number;
  /** Загальна сума до сплати (subtotal + tax_amount). */
  total_amount?: number;
  /** Розподіл податку за різними рівнями юрисдикцій. */
  breakdown?: TaxBreakdown;
  /** Список назв юрисдикцій, що застосовуються до цього замовлення. */
  jurisdictions?: string[];
}

/**
 * Відповідь сервера на запит масового імпорту замовлень через CSV-файл.
 */
export interface ImportCSVResponse {
  total_processed: number;
  success_count: number;
  error_count: number;
  /** Детальний перелік помилок у розрізі рядків CSV-файлу. */
  errors: {
    row: number;
    reason: string;
  }[];
}

/**
 * Структура помилки валідації полів (стандартний формат FastAPI).
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Універсальна структура відповіді з помилкою від API.
 */
export interface ApiError {
  /** Текстове повідомлення про помилку або масив деталей валідації. */
  detail: string | ValidationError[];
}

/**
 * Об'єкт із даними (payload), що відправляється при спробі входу.
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Відповідь сервера після успішної авторизації користувача.
 */
export interface LoginResponse {
  access_token: string;       // JWT-токен
  expires_in?: number; // необов'язково, якщо бекенд віддає час життя токена
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}