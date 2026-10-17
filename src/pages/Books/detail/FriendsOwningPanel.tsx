import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { bookMatchKey } from '../../../lib/books/bookIdentity';
import { showToast } from '../../../lib/interaction/toast';
import { canAskForBook, sendBookLoanRequest } from '../../../services/books/bookLoanRequest';
import { t } from '../../../services/i18n';
import { useFriendsOwningBook } from '../hooks/useFriendsOwnedBooks';

/** Freunde, die das Buch besitzen — mit „Anfragen" als Leihwunsch per Benachrichtigung. */
export const FriendsOwningPanel: React.FC<{
  id: string;
  title: string;
  authors: string[];
}> = ({ id, title, authors }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const owners = useFriendsOwningBook(id, title, authors);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const bookKey = bookMatchKey(title, authors);

  if (owners.length === 0) return null;

  const ask = async (friendUid: string) => {
    if (!user) return;
    setAsked((prev) => new Set(prev).add(friendUid));
    try {
      await sendBookLoanRequest({
        fromUid: user.uid,
        fromName: user.displayName || t('Ein Freund'),
        toUid: friendUid,
        bookId: id,
        bookTitle: title.slice(0, 200),
        bookKey,
      });
      showToast(t('Anfrage geschickt'));
    } catch {
      setAsked((prev) => {
        const next = new Set(prev);
        next.delete(friendUid);
        return next;
      });
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
    }
  };

  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        {t('Bei Freunden vorhanden')}
      </h2>
      {owners.map((o) => {
        const done = asked.has(o.friendUid) || !canAskForBook(o.friendUid, bookKey);
        return (
          <div
            key={o.friendUid}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}
          >
            <span
              style={{ flex: 1, minWidth: 0, color: currentTheme.text.secondary, fontWeight: 700 }}
            >
              {o.friendName}
            </span>
            <button
              type="button"
              className="bk-chip-btn"
              disabled={done}
              onClick={() => void ask(o.friendUid)}
              style={{ color: done ? currentTheme.text.muted : currentTheme.primary }}
            >
              {done ? t('Leihwunsch gesendet') : t('Leihen anfragen')}
            </button>
          </div>
        );
      })}
    </div>
  );
};
