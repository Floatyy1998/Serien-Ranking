import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from '../../components/ui';
import { useAndroidBack } from '../../hooks/ui/useAndroidBack';
import { hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import {
  copyableText,
  deleteMessageForAll,
  forwardMessages,
  hideMessagesForMe,
  publishReadReceipt,
  setPinned,
  setReadReceiptsEnabled,
  setStarred,
  subscribeHiddenMessages,
  subscribePartnerRead,
  subscribePinned,
  subscribeReadReceiptsEnabled,
  subscribeStarred,
  type PinnedMessage,
  type StarredMessage,
} from '../../services/chat/chatMessageActions';
import {
  canEditMessage,
  reportChat,
  setReaction,
  subscribeSummary,
  type ChatMessage,
  type ChatSummary,
} from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { ChatDeleteDialog } from './ChatDeleteDialog';
import { ChatForwardSheet } from './ChatForwardSheet';
import { ChatMessageMenu } from './ChatMessageMenu';
import { ChatPinnedBar } from './ChatPinnedBar';
import { ChatStarredSheet } from './ChatStarredSheet';

interface Options {
  myUid: string | undefined;
  myName: string;
  pairId: string | null;
  friendId: string;
  partnerName: string;
  chatReady: boolean;
  canReply: boolean;
  messages: ChatMessage[];
  reactions: Record<string, Record<string, string>>;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
  onJump: (id: string) => void;
}

const NO_STARS: StarredMessage[] = [];

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

export function useChatMessageActions({
  myUid,
  myName,
  pairId,
  friendId,
  partnerName,
  chatReady,
  canReply,
  messages,
  reactions,
  onReply,
  onEdit,
  onJump,
}: Options) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [starred, setStarredList] = useState<StarredMessage[]>(NO_STARS);
  const [pinned, setPinnedState] = useState<PinnedMessage | null>(null);
  const [partnerReadAt, setPartnerReadAt] = useState(0);
  const [receiptsEnabled, setReceiptsEnabled] = useState(true);
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [menu, setMenu] = useState<{ message: ChatMessage; anchor: DOMRect } | null>(null);
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<ChatMessage[] | null>(null);
  const [forwardTargets, setForwardTargets] = useState<ChatMessage[] | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [starredOpen, setStarredOpen] = useState(false);

  useEffect(() => {
    setMenu(null);
    setSelection(null);
    setHidden(new Set());
    setStarredList(NO_STARS);
    setPinnedState(null);
    setPartnerReadAt(0);
    if (!myUid || !pairId || !chatReady) return;
    const offs = [
      subscribeHiddenMessages(myUid, pairId, setHidden),
      subscribeStarred(myUid, pairId, setStarredList),
      subscribePinned(pairId, setPinnedState),
      subscribePartnerRead(pairId, friendId, setPartnerReadAt),
      subscribeSummary(pairId, setSummary),
    ];
    return () => offs.forEach((off) => off());
  }, [myUid, pairId, friendId, chatReady]);

  useEffect(() => {
    if (!myUid) return;
    return subscribeReadReceiptsEnabled(myUid, setReceiptsEnabled);
  }, [myUid]);

  const visibleMessages = useMemo(
    () => (hidden.size ? messages.filter((m) => !hidden.has(m.id)) : messages),
    [messages, hidden]
  );
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const starredIds = useMemo(() => new Set(starred.map((s) => s.id)), [starred]);

  /** Lese-Stand fürs Gegenüber — nur wer selbst Bestätigungen sendet, sieht auch fremde. */
  const publishRead = useCallback(() => {
    if (myUid && pairId && receiptsEnabled) void publishReadReceipt(myUid, pairId);
  }, [myUid, pairId, receiptsEnabled]);

  const receiptFor = useCallback(
    (m: ChatMessage): 'sent' | 'read' | null => {
      if (!receiptsEnabled || m.senderId !== myUid || m.deleted) return null;
      return partnerReadAt >= m.timestamp ? 'read' : 'sent';
    },
    [receiptsEnabled, myUid, partnerReadAt]
  );

  const toggleReceipts = useCallback(async () => {
    if (!myUid) return;
    const next = !receiptsEnabled;
    try {
      await setReadReceiptsEnabled(myUid, next);
      if (next && pairId) void publishReadReceipt(myUid, pairId);
      showToast(next ? t('Lesebestätigungen an.') : t('Lesebestätigungen aus.'), 2500);
    } catch {
      showToast(t('Das hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
    }
  }, [myUid, pairId, receiptsEnabled]);

  const openMenu = useCallback((m: ChatMessage) => {
    const el = document.querySelector<HTMLElement>(
      `[data-msg-id="${CSS.escape(m.id)}"] .ch-bubble`
    );
    if (!el) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.tagName === 'TEXTAREA') active.blur();
    setMenu({ message: m, anchor: el.getBoundingClientRect() });
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const clearSelection = useCallback(() => setSelection(null), []);
  useAndroidBack(selection !== null && !menu, clearSelection);

  const toggleSelect = useCallback((id: string) => {
    hapticTap();
    setSelection((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size ? next : null;
    });
  }, []);

  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection]);

  const selectedMessages = useMemo(
    () => (selection ? visibleMessages.filter((m) => selection.has(m.id)) : []),
    [selection, visibleMessages]
  );

  const copyMessages = useCallback(
    async (list: ChatMessage[]) => {
      const parts = list
        .map((m) => {
          const text = copyableText(m);
          if (!text) return null;
          if (list.length === 1) return text;
          const when = new Date(m.timestamp).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return `[${when}] ${m.senderId === myUid ? myName : partnerName}: ${text}`;
        })
        .filter((p): p is string => !!p);
      if (!parts.length) return;
      await writeClipboard(parts.join('\n'));
      showToast(t('Kopiert.'), 2000);
    },
    [myUid, myName, partnerName]
  );

  const toggleStars = useCallback(
    async (list: ChatMessage[]) => {
      if (!myUid || !pairId) return;
      const live = list.filter((m) => !m.deleted);
      const star = live.some((m) => !starredIds.has(m.id));
      try {
        await setStarred(myUid, pairId, live, star);
      } catch {
        showToast(t('Das hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
      }
    },
    [myUid, pairId, starredIds]
  );

  const togglePin = useCallback(
    async (m: ChatMessage) => {
      if (!myUid || !pairId) return;
      const unpin = pinned?.id === m.id;
      try {
        await setPinned(myUid, pairId, unpin ? null : m);
        showToast(unpin ? t('Nachricht gelöst.') : t('Nachricht fixiert.'), 2000);
      } catch {
        showToast(t('Das hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
      }
    },
    [myUid, pairId, pinned]
  );

  const runDelete = useCallback(
    async (forAll: boolean) => {
      const targets = deleteTargets;
      setDeleteTargets(null);
      setSelection(null);
      if (!myUid || !pairId || !targets?.length) return;
      try {
        if (forAll) {
          for (const m of targets) {
            await deleteMessageForAll(myUid, pairId, m, summary, pinned?.id ?? null);
          }
        } else {
          await hideMessagesForMe(
            myUid,
            pairId,
            targets.map((m) => m.id)
          );
        }
        const stale = targets.filter((m) => starredIds.has(m.id));
        if (stale.length) await setStarred(myUid, pairId, stale, false).catch(() => {});
      } catch {
        showToast(t('Löschen hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
      }
    },
    [deleteTargets, myUid, pairId, summary, pinned, starredIds]
  );

  const runForward = useCallback(
    async (friendUids: string[]) => {
      const targets = forwardTargets;
      if (!myUid || !targets?.length || forwarding) return;
      setForwarding(true);
      try {
        for (const uid of friendUids) {
          await forwardMessages(myUid, uid, targets, myName);
        }
        setForwardTargets(null);
        setSelection(null);
        showToast(t('Weitergeleitet.'), 2500);
      } catch {
        showToast(t('Weiterleiten hat nicht geklappt — versuch es nochmal.'), 4000, 'error');
      } finally {
        setForwarding(false);
      }
    },
    [forwardTargets, myUid, myName, forwarding]
  );

  const runReport = useCallback(async () => {
    const target = reportTarget;
    setReportTarget(null);
    if (!myUid || !pairId || !target) return;
    try {
      await reportChat(
        { uid: myUid, name: myName },
        friendId,
        partnerName,
        pairId,
        messages,
        target.id
      );
      showToast(t('Meldung gesendet — wir schauen uns das an.'), 4000);
    } catch {
      showToast(t('Meldung konnte nicht gesendet werden.'), 4000, 'error');
    }
  }, [reportTarget, myUid, myName, pairId, friendId, partnerName, messages]);

  const menuMessage = menu ? (byId.get(menu.message.id) ?? menu.message) : null;
  const myReaction = menuMessage && myUid ? (reactions[menuMessage.id]?.[myUid] ?? null) : null;
  const canDeleteForAll =
    !!deleteTargets?.length && deleteTargets.every((m) => m.senderId === myUid && !m.deleted);

  /** Mit dem Menü-Eintrag schließen — die Aktion läuft danach. */
  const fromMenu = (action: (m: ChatMessage) => void) => () => {
    if (!menuMessage) return;
    const m = menuMessage;
    setMenu(null);
    action(m);
  };

  const pinnedBar = (
    <AnimatePresence>
      {pinned && (
        <ChatPinnedBar
          pinned={pinned}
          onJump={() => onJump(pinned.id)}
          onUnpin={() => {
            if (myUid && pairId) void setPinned(myUid, pairId, null).catch(() => {});
          }}
        />
      )}
    </AnimatePresence>
  );

  const overlays = (
    <>
      {menu && menuMessage && (
        <ChatMessageMenu
          anchor={menu.anchor}
          own={menuMessage.senderId === myUid}
          deleted={!!menuMessage.deleted}
          myReaction={myReaction}
          starred={starredIds.has(menuMessage.id)}
          pinned={pinned?.id === menuMessage.id}
          canReply={canReply}
          canCopy={!!copyableText(menuMessage)}
          canReact={canReply && !menuMessage.deleted}
          canEdit={canReply && !!myUid && canEditMessage(menuMessage, myUid)}
          onReact={(emoji) => {
            const m = menuMessage;
            setMenu(null);
            if (myUid && pairId) void setReaction(myUid, pairId, m.id, emoji).catch(() => {});
          }}
          onReply={fromMenu(onReply)}
          onCopy={fromMenu((m) => void copyMessages([m]))}
          onEdit={fromMenu(onEdit)}
          onForward={fromMenu((m) => setForwardTargets([m]))}
          onPin={fromMenu((m) => void togglePin(m))}
          onStar={fromMenu((m) => void toggleStars([m]))}
          onSelect={fromMenu((m) => setSelection(new Set([m.id])))}
          onReport={fromMenu((m) => setReportTarget(m))}
          onDelete={fromMenu((m) => setDeleteTargets([m]))}
          onClose={closeMenu}
        />
      )}
      <ChatDeleteDialog
        count={deleteTargets ? deleteTargets.length : null}
        canDeleteForAll={canDeleteForAll}
        onDeleteForAll={() => void runDelete(true)}
        onDeleteForMe={() => void runDelete(false)}
        onClose={() => setDeleteTargets(null)}
      />
      {myUid && (
        <ChatForwardSheet
          myUid={myUid}
          count={forwardTargets?.length ?? 0}
          isOpen={!!forwardTargets}
          sending={forwarding}
          onClose={() => !forwarding && setForwardTargets(null)}
          onSend={(uids) => void runForward(uids)}
        />
      )}
      {myUid && (
        <ChatStarredSheet
          isOpen={starredOpen}
          starred={starred}
          myUid={myUid}
          partnerName={partnerName}
          onClose={() => setStarredOpen(false)}
          onJump={(id) => {
            setStarredOpen(false);
            onJump(id);
          }}
        />
      )}
      <Dialog
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={t('Nachricht melden')}
        message={t(
          'Die Nachricht wird mit etwas Verlauf davor zur Prüfung an die Moderation übermittelt. Fortfahren?'
        )}
        type="warning"
        actions={[
          { label: t('Abbrechen'), onClick: () => setReportTarget(null), variant: 'secondary' },
          { label: t('Melden'), onClick: () => void runReport(), variant: 'primary' },
        ]}
      />
    </>
  );

  return {
    visibleMessages,
    starredIds,
    pinnedBar,
    overlays,
    receiptsEnabled,
    receiptFor,
    publishRead,
    toggleReceipts,
    openStarred: () => setStarredOpen(true),
    menuMessageId: menu?.message.id ?? null,
    openMenu,
    selection,
    selectedMessages,
    toggleSelect,
    clearSelection,
    copySelected: () => void copyMessages(selectedMessages),
    forwardSelected: () => selectedMessages.length && setForwardTargets(selectedMessages),
    starSelected: () => void toggleStars(selectedMessages).then(() => setSelection(null)),
    deleteSelected: () => selectedMessages.length && setDeleteTargets(selectedMessages),
    allSelectedStarred:
      selectedMessages.length > 0 && selectedMessages.every((m) => starredIds.has(m.id)),
  };
}
