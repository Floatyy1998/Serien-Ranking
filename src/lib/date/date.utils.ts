export const getFormattedDate = (date: string) => {
  if (!date) return 'Kein Datum';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Ungültiges Datum';
  return parsedDate.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
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
