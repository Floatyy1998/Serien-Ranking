/** Analytics-Dashboard — nur für die hartkodierte Admin-UID zugänglich. */
import {
  Assessment,
  BugReport,
  FiberNew,
  FilterAlt,
  ConfirmationNumber,
  Extension,
  Gavel,
  PersonSearch,
  Groups,
  HealthAndSafety,
  History,
  Message,
  Refresh,
  ReportProblem,
  Settings,
  Speed,
  Timeline,
  Timer,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import './AdminDashboardPage.css';
import './adminKit.css';
import { ActivityTab } from './tabs/ActivityTab';
import { EventsTab } from './tabs/EventsTab';
import { ExtensionTab } from './tabs/ExtensionTab';
import { OverviewTab } from './tabs/OverviewTab';
import { RealtimeTab } from './tabs/RealtimeTab';
import { UsersTab } from './tabs/UsersTab';
import { BackendErrorsTab } from './tabs/BackendErrorsTab';
import { ClientErrorsTab } from './tabs/ClientErrorsTab';
import { SuspiciousAccountsTab } from './tabs/SuspiciousAccountsTab';
import { DataHealthTab } from './tabs/DataHealthTab';
import { MessagesTab } from './tabs/MessagesTab';
import { TicketsTab } from './tabs/TicketsTab';
import { ConfigTab } from './tabs/ConfigTab';
import { NewEpisodesTab } from './tabs/NewEpisodesTab';
import { AnimeFillerTab } from './tabs/AnimeFillerTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { ModerationTab } from './tabs/ModerationTab';
import { useAdminDashboardData } from './useAdminDashboardData';
import { useAdminGuard } from './useAdminGuard';

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    group: 'Überblick',
    icon: <Assessment style={{ fontSize: 16 }} />,
  },
  { id: 'realtime', label: 'Live', group: 'Überblick', icon: <Speed style={{ fontSize: 16 }} /> },
  { id: 'users', label: 'Users', group: 'Nutzung', icon: <Groups style={{ fontSize: 16 }} /> },
  {
    id: 'activity',
    label: 'Activity',
    group: 'Nutzung',
    icon: <History style={{ fontSize: 16 }} />,
  },
  { id: 'events', label: 'Events', group: 'Nutzung', icon: <Timeline style={{ fontSize: 16 }} /> },
  {
    id: 'extension',
    label: 'Extension',
    group: 'Nutzung',
    icon: <Extension style={{ fontSize: 16 }} />,
  },
  {
    id: 'tickets',
    label: 'Tickets',
    group: 'Community',
    icon: <ConfirmationNumber style={{ fontSize: 16 }} />,
  },
  {
    id: 'moderation',
    label: 'Moderation',
    group: 'Community',
    icon: <Gavel style={{ fontSize: 16 }} />,
  },
  {
    id: 'suspicious',
    label: 'Verdacht',
    group: 'Community',
    icon: <PersonSearch style={{ fontSize: 16 }} />,
  },
  {
    id: 'messages',
    label: 'Messages',
    group: 'Community',
    icon: <Message style={{ fontSize: 16 }} />,
  },
  {
    id: 'health',
    label: 'Data Health',
    group: 'Betrieb',
    icon: <HealthAndSafety style={{ fontSize: 16 }} />,
  },
  {
    id: 'new-episodes',
    label: 'Neue Folgen',
    group: 'Inhalte',
    icon: <FiberNew style={{ fontSize: 16 }} />,
  },
  {
    id: 'anime-filler',
    label: 'Anime Filler',
    group: 'Inhalte',
    icon: <FilterAlt style={{ fontSize: 16 }} />,
  },
  { id: 'performance', label: 'Perf', group: 'Betrieb', icon: <Timer style={{ fontSize: 16 }} /> },
  {
    id: 'client-errors',
    label: 'Client-Fehler',
    group: 'Betrieb',
    icon: <ReportProblem style={{ fontSize: 16 }} />,
  },
  {
    id: 'backend',
    label: 'Backend',
    group: 'Betrieb',
    icon: <BugReport style={{ fontSize: 16 }} />,
  },
  { id: 'config', label: 'Config', group: 'Inhalte', icon: <Settings style={{ fontSize: 16 }} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

// Reihenfolge der Abschnitte in der Leiste. 18 Tabs nebeneinander waren nicht
// ueberschaubar — gruppiert findet man den gesuchten Bereich, ohne zu suchen.
const TAB_GRUPPEN = ['Überblick', 'Nutzung', 'Community', 'Betrieb', 'Inhalte'] as const;

export function AdminDashboardPage() {
  const { isAdmin, checking } = useAdminGuard();
  const { currentTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  // Die URL ist die einzige Quelle der Wahrheit fuer den offenen Tab: Tabs
  // sind damit verlinkbar, der Zurueck-Knopf funktioniert, und ein Reload
  // landet wieder an derselben Stelle.
  const paramTab = searchParams.get('tab');
  const activeTab: TabId = TABS.some((t) => t.id === paramTab) ? (paramTab as TabId) : 'overview';
  // Der Hook laedt nur, was der offene Tab wirklich braucht.
  const data = useAdminDashboardData(30, activeTab);

  const selectTab = useCallback(
    (id: TabId) => {
      // Unter-Parameter (ticket, uid, ...) fallen beim Wechsel weg — sonst
      // erbt der neue Tab eine Auswahl, die nicht zu ihm gehoert.
      setSearchParams(id === 'overview' ? {} : { tab: id });
    },
    [setSearchParams]
  );

  const handleRefresh = useCallback(() => data.refresh(), [data]);

  if (checking || !isAdmin) {
    return (
      <PageLayout>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: currentTheme.text.muted,
          }}
        >
          Lade...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Admin Dashboard"
        gradientFrom={currentTheme.primary}
        subtitle="Analytics & Monitoring"
        sticky
      />

      {/* Tab Navigation */}
      <div className="admin-tab-bar">
        <div className="admin-tab-scroll">
          {TAB_GRUPPEN.map((gruppe) => (
            <div className="admin-tab-group" key={gruppe}>
              <span className="admin-tab-group__label" style={{ color: currentTheme.text.muted }}>
                {gruppe}
              </span>
              {TABS.filter((t) => t.group === gruppe).map((tab) => (
                <button
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
                  onClick={() => selectTab(tab.id)}
                  style={{
                    color: activeTab === tab.id ? currentTheme.primary : currentTheme.text.muted,
                    borderColor: activeTab === tab.id ? currentTheme.primary : 'transparent',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          ))}

          <span
            style={{
              marginLeft: 'auto',
              alignSelf: 'center',
              fontSize: 12,
              whiteSpace: 'nowrap',
              color: currentTheme.text.muted,
            }}
            title="Daten werden nicht mehr automatisch nachgeladen — hier bewusst aktualisieren"
          >
            {data.lastUpdated
              ? `Stand ${new Date(data.lastUpdated).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''}
          </span>

          <button
            className="admin-tab admin-refresh-btn"
            onClick={handleRefresh}
            style={{ color: currentTheme.text.muted }}
          >
            <Refresh style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {data.loading && (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: currentTheme.text.muted,
            fontSize: 14,
          }}
        >
          Daten laden...
        </div>
      )}

      {!data.loading && (
        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab data={data} theme={currentTheme} />}
              {activeTab === 'realtime' && <RealtimeTab data={data} theme={currentTheme} />}
              {activeTab === 'users' && <UsersTab data={data} theme={currentTheme} />}
              {activeTab === 'activity' && <ActivityTab data={data} theme={currentTheme} />}
              {activeTab === 'events' && <EventsTab data={data} theme={currentTheme} />}
              {activeTab === 'extension' && <ExtensionTab data={data} theme={currentTheme} />}
              {activeTab === 'tickets' && <TicketsTab theme={currentTheme} />}
              {activeTab === 'moderation' && <ModerationTab theme={currentTheme} />}
              {activeTab === 'messages' && <MessagesTab theme={currentTheme} />}
              {activeTab === 'health' && <DataHealthTab data={data} theme={currentTheme} />}
              {activeTab === 'new-episodes' && <NewEpisodesTab theme={currentTheme} />}
              {activeTab === 'anime-filler' && <AnimeFillerTab />}
              {activeTab === 'performance' && <PerformanceTab theme={currentTheme} />}
              {activeTab === 'client-errors' && <ClientErrorsTab />}
              {activeTab === 'suspicious' && <SuspiciousAccountsTab />}
              {activeTab === 'backend' && <BackendErrorsTab data={data} theme={currentTheme} />}
              {activeTab === 'config' && <ConfigTab theme={currentTheme} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </PageLayout>
  );
}
