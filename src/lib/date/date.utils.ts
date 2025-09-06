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
