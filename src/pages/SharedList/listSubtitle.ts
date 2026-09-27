import { t } from '../../services/i18n';

export function listSubtitle(ownerName: string, count: number): string {
  const titles = count === 1 ? t('1 Titel') : t('{n} Titel', { n: count });
  return ownerName ? t('Liste von {name} · {titles}', { name: ownerName, titles }) : titles;
}
