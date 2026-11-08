import Send from '@mui/icons-material/Send';
import { showToast } from '../../lib/interaction/toast';
import { t } from '../../services/i18n';
import { shareLink } from '../../services/share/shareLink';
import { IconButton } from '../ui/input/IconButton';

export const ShareTitleButton = ({
  path,
  title,
  style,
}: {
  path: string;
  title: string;
  style?: React.CSSProperties;
}) => (
  <IconButton
    icon={<Send style={{ fontSize: '18px' }} />}
    onClick={() =>
      void shareLink({
        url: `https://tv-rank.de${path}`,
        title,
        text: t('Schau dir {title} auf TV-RANK an', { title }),
      }).then((result) => {
        if (result === 'copied') showToast(t('Link kopiert!'));
        else if (result === 'failed') showToast(t('Teilen hat nicht geklappt'), 2000, 'error');
      })
    }
    size={40}
    borderRadius="14px"
    variant="glass"
    ariaLabel={t('Teilen')}
    tooltip={t('Teilen')}
    style={style}
  />
);
