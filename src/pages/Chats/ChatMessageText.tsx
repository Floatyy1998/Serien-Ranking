import { Fragment, memo, useMemo } from 'react';
import { linkifyText } from '../../lib/text/linkify';

export const ChatMessageText = memo(
  ({ text, onLink }: { text: string; onLink: (href: string) => void }) => {
    const segments = useMemo(() => linkifyText(text), [text]);
    return (
      <>
        {segments.map((s, i) =>
          s.kind === 'text' ? (
            <Fragment key={i}>{s.text}</Fragment>
          ) : (
            <a
              key={i}
              className="ch-link"
              href={s.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLink(s.href);
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {s.text}
            </a>
          )
        )}
      </>
    );
  }
);
ChatMessageText.displayName = 'ChatMessageText';
