export const formatCurrency = (value: number): string => {
  // Використовуємо вбудований Intl для правильного форматування валюти
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};