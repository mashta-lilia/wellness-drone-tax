/**
 * Форматує числове значення у грошовий формат (USD).
 * Коректно обробляє null, undefined та NaN, повертаючи базове значення '$0.00'.
 *
 * @param value - Сума для форматування.
 * @returns Відформатований рядок у вигляді валюти (наприклад, '$12.50').
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Перетворює десятковий дріб у відсотковий формат.
 * Коректно обробляє null, undefined та NaN, повертаючи '0.00%'.
 *
 * @param value - Частка для перетворення (наприклад, 0.05).
 * @returns Відформатований рядок у вигляді відсотків (наприклад, '5.00%').
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Форматує географічні координати (широту або довготу) до 4 знаків після коми.
 * Коректно обробляє null, undefined та NaN, повертаючи '0.0000'.
 *
 * @param value - Значення координати.
 * @returns Відформатований рядок з фіксованою точністю (наприклад, '40.7128').
 */
export const formatCoordinate = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0000';
  return value.toFixed(4);
};