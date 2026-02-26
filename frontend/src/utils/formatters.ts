/**
 * Форматує число у валюту (долари $)
 * Враховує 0, null та undefined
 */
export const formatCurrency = (value: number | null | undefined): string => {
  // Якщо значення немає або це не число, повертаємо $0.00
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
 * Перетворює частку (0.05) у відсотки (5.00%)
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  // Використовуємо стандартний формат для відсотків
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
export const formatCoordinate = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0000';
  return value.toFixed(4); // Централізоване місце для точності координат
};