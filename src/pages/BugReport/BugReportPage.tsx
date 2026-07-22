import { Add, Feedback } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { NewTicketForm } from './components/NewTicketForm';
import { TicketCard } from './components/TicketCard';
import { useBugReportData } from './useBugReportData';
import { t } from '../../services/i18n';

// Offene Tickets zuerst — der Rest wandert ins Archiv
const isArchived = (status: string) => ['done', 'rejected', 'obsolete', 'closed'].includes(status);

export const BugReportPage = memo(() => {
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const {
    tickets,
    loading,
    uploadScreenshot,
    createTicket,
    addComment,
    updateTicket,
    closeTicket,
  } = useBugReportData();
  const [showForm, setShowForm] = useState(() => searchParams.get('create') === 'true');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'archive'>('open');
  const initialErrors = searchParams.get('errors') || '';

  const openTickets = tickets.filter((tk) => !isArchived(tk.status));
  const archivedTickets = tickets.filter((tk) => isArchived(tk.status));
  const visibleTickets = activeTab === 'open' ? openTickets : archivedTickets;

  return (
    <PageLayout>
      <PageHeader
        title="Feedback & Bugs"
        gradientFrom={currentTheme.primary}
        subtitle={t('Bugs melden oder Features vorschlagen')}
        icon={<Feedback />}
        sticky
      />

      <div style={{ padding: '16px', paddingBottom: '100px' }}>
        {!showForm && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              maxWidth: 860,
              padding: '14px',
              borderRadius: '12px',
              border: `2px dashed ${currentTheme.primary}40`,
              background: `${currentTheme.primary}08`,
              color: currentTheme.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <Add style={{ fontSize: 20 }} />
            {t('Neues Ticket erstellen')}
          </motion.button>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <NewTicketForm
                theme={currentTheme}
                onSubmit={async (data) => {
                  const success = await createTicket(data);
                  if (success) setShowForm(false);
                  return success;
                }}
                onCancel={() => setShowForm(false)}
                onUpload={uploadScreenshot}
                initialConsoleErrors={initialErrors}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <h3
          style={{
            fontSize: '14px',
            color: currentTheme.text.secondary,
            margin: '0 0 12px',
            fontWeight: 600,
          }}
        >
          {t('Meine Tickets')} ({tickets.length})
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {(
            [
              { id: 'open', label: t('Offen'), count: openTickets.length },
              { id: 'archive', label: t('Archiv'), count: archivedTickets.length },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setActiveTab(tab.id);
                  setExpandedTicket(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: `1px solid ${active ? currentTheme.primary : currentTheme.border.default}`,
                  background: active ? `${currentTheme.primary}22` : 'rgba(255,255,255,0.03)',
                  color: active ? currentTheme.primary : currentTheme.text.secondary,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {tab.label} ({tab.count})
              </motion.button>
            );
          })}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: currentTheme.text.muted }}>
            {t('Laden...')}
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
              fontSize: '14px',
            }}
          >
            {t('Du hast noch keine Tickets erstellt.')}
          </div>
        )}

        {!loading && tickets.length > 0 && visibleTickets.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
              fontSize: '14px',
            }}
          >
            {activeTab === 'open' ? t('Keine offenen Tickets.') : t('Keine archivierten Tickets.')}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {visibleTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                theme={currentTheme}
                expanded={expandedTicket === ticket.id}
                onToggle={() =>
                  setExpandedTicket((prev) => (prev === ticket.id ? null : ticket.id))
                }
                onAddComment={(text) => addComment(ticket.id, text)}
                onUpdate={(updates) => updateTicket(ticket.id, updates)}
                onClose={() => closeTicket(ticket.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
});

BugReportPage.displayName = 'BugReportPage';
