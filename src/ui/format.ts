/** 12340 → "12.340" */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 1.5 → "x1,5" */
export function formatMultiplier(value: number): string {
  return `x${String(value).replace('.', ',')}`;
}

/** 4.23 → "4,3" (redondea hacia arriba para que el contador no muestre 0,0 antes de terminar). */
export function formatSeconds(value: number): string {
  return (Math.ceil(value * 10) / 10).toFixed(1).replace('.', ',');
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
