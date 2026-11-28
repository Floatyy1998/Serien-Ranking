interface StatusSource {
  status?: string | null;
  production?: { production?: boolean } | null;
}

export function isSeriesOngoing(series: StatusSource): boolean {
  const status = series.status?.toLowerCase();
  return (
    status === 'returning series' ||
    status === 'ongoing' ||
    (!status && series.production?.production === true)
  );
}

export function isSeriesEnded(series: StatusSource): boolean {
  const status = series.status?.toLowerCase();
  return (
    status === 'ended' ||
    status === 'canceled' ||
    (!status && series.production?.production === false)
  );
}
