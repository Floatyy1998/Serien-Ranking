/**
 * Returns a date as YYYY-MM-DD string in the local timezone.
 * Unlike toISOString().split('T')[0], this avoids UTC conversion
 * which can shift the date by ±1 day depending on timezone.
 */
export const toLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormattedDate = (date: string) => {
  if (!date) return 'Kein Datum';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Ungültiges Datum';

  const day = parsedDate.getDate().toString().padStart(2, '0');
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
  const year = parsedDate.getFullYear();

  return `${day}.${month}.${year}`;
};
export const getFormattedTime = (date: string) => {
  if (!date) return 'Keine Zeit';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Ungültige Zeit';
  return parsedDate.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
