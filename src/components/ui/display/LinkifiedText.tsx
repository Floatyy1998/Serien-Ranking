import { Fragment, memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { internalPath, linkHost, linkifyText } from '../../../lib/text/linkify';
import { t } from '../../../services/i18n';
import { Dialog } from '../overlay/Dialog';

const OWN_HOSTS = ['tv-rank.de', 'www.tv-rank.de'];

const linkStyle = {
  color: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  overflowWrap: 'anywhere' as const,
  cursor: 'pointer',
};

export const LinkifiedText = memo(({ text }: { text: string }) => {
  const navigate = useNavigate();
  const segments = useMemo(() => linkifyText(text), [text]);
  const [pendingLink, setPendingLink] = useState('');

  const openLink = (href: string) => {
    const path = internalPath(href, [...OWN_HOSTS, window.location.hostname]);
    if (path) navigate(path);
    else setPendingLink(href);
  };

  return (
    <>
      {segments.map((s, i) =>
        s.kind === 'text' ? (
          <Fragment key={i}>{s.text}</Fragment>
        ) : (
          <a
            key={i}
            href={s.href}
            style={linkStyle}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openLink(s.href);
            }}
          >
            {s.text}
          </a>
        )
      )}
      {pendingLink && (
        <Dialog
          open
          onClose={() => setPendingLink('')}
          title={t('Du verlässt TV-Rank')}
          message={t(
            'Der Link öffnet {host} in einem neuen Tab. Öffne nur Links von Leuten, denen du vertraust.',
            { host: linkHost(pendingLink) }
          )}
          type="warning"
          actions={[
            { label: t('Abbrechen'), onClick: () => {}, variant: 'secondary' },
            {
              label: t('Link öffnen'),
              onClick: () => window.open(pendingLink, '_blank', 'noopener,noreferrer'),
              variant: 'primary',
            },
          ]}
        />
      )}
    </>
  );
});
LinkifiedText.displayName = 'LinkifiedText';
