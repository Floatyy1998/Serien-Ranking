/**
 * Einheitliche Episode-Datum Formatierung für konsistente Anzeige
 */

export const getUnifiedEpisodeDate = (date: string | Date): string => {
  if (!date) return '';
  
  const episodeDate = new Date(date);
  
  // Prüfe auf ungültiges Datum
  if (isNaN(episodeDate.getTime())) return '';
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Deutsche Zeitzone für konsistente Anzeige
  const germanDate = episodeDate.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Heute/Morgen Logic
  const todayGerman = today.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin'
  });
  const tomorrowGerman = tomorrow.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin'
  });
  const episodeDateGerman = episodeDate.toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin'
  });
  
  if (episodeDateGerman === todayGerman) {
    return 'Heute';
  } else if (episodeDateGerman === tomorrowGerman) {
    return 'Morgen';
  }
  
  return germanDate;
};

export const getUnifiedEpisodeTime = (date: string | Date): string => {
  if (!date) return '';
  
  const episodeDate = new Date(date);
  
  // Prüfe auf ungültiges Datum
  if (isNaN(episodeDate.getTime())) return '';
  
  // Deutsche Zeitzone für konsistente Anzeige
  return episodeDate.toLocaleTimeString('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getUnifiedEpisodeDateTime = (date: string | Date): { dateString: string; timeString: string } => {
  return {
    dateString: getUnifiedEpisodeDate(date),
    timeString: getUnifiedEpisodeTime(date)
  };
};