/**
 * AdminDashboardPage - Clean analytics dashboard.
 * Only accessible by hardcoded admin UID.
 *
 * Tabs: Overview, Live, Users, Events, Extension
 */
import {
  Assessment,
  BugReport,
  ConfirmationNumber,
  Extension,
  Groups,
  HealthAndSafety,
  History,
  Message,
  Refresh,
  Settings,
  Speed,
  Timeline,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import './AdminDashboardPage.css';
import { ActivityTab } from './tabs/ActivityTab';
import { EventsTab } from './tabs/EventsTab';
import { ExtensionTab } from './tabs/ExtensionTab';
import { OverviewTab } from './tabs/OverviewTab';
import { RealtimeTab } from './tabs/RealtimeTab';
import { UsersTab } from './tabs/UsersTab';
import { BackendErrorsTab } from './tabs/BackendErrorsTab';
import { DataHealthTab } from './tabs/DataHealthTab';
import { MessagesTab } from './tabs/MessagesTab';
import { TicketsTab } from './tabs/TicketsTab';
import { ConfigTab } from './tabs/ConfigTab';
import { useAdminDashboardData } from './useAdminDashboardData';
import { useAdminGuard } from './useAdminGuard';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Assessment style={{ fontSize: 16 }} /> },
  { id: 'realtime', label: 'Live', icon: <Speed style={{ fontSize: 16 }} /> },
  { id: 'users', label: 'Users', icon: <Groups style={{ fontSize: 16 }} /> },
  { id: 'activity', label: 'Activity', icon: <History style={{ fontSize: 16 }} /> },
  { id: 'events', label: 'Events', icon: <Timeline style={{ fontSize: 16 }} /> },
  { id: 'extension', label: 'Extension', icon: <Extension style={{ fontSize: 16 }} /> },
  { id: 'tickets', label: 'Tickets', icon: <ConfirmationNumber style={{ fontSize: 16 }} /> },
  { id: 'messages', label: 'Messages', icon: <Message style={{ fontSize: 16 }} /> },
  { id: 'health', label: 'Data Health', icon: <HealthAndSafety style={{ fontSize: 16 }} /> },
  { id: 'backend', label: 'Backend', icon: <BugReport style={{ fontSize: 16 }} /> },
  { id: 'config', label: 'Config', icon: <Settings style={{ fontSize: 16 }} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function AdminDashboardPage() {
  const { isAdmin, checking } = useAdminGuard();
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const param = searchParams.get('tab');
    const valid = TABS.some((t) => t.id === param);
    return valid ? (param as TabId) : 'overview';
  });
  const data = useAdminDashboardData(30);

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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                color: activeTab === tab.id ? currentTheme.primary : currentTheme.text.muted,
                borderColor: activeTab === tab.id ? currentTheme.primary : 'transparent',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            className="admin-tab admin-refresh-btn"
            onClick={handleRefresh}
            style={{ color: currentTheme.text.muted, marginLeft: 'auto' }}
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
              {activeTab === 'messages' && <MessagesTab theme={currentTheme} />}
              {activeTab === 'health' && <DataHealthTab data={data} theme={currentTheme} />}
              {activeTab === 'backend' && <BackendErrorsTab data={data} theme={currentTheme} />}
              {activeTab === 'config' && <ConfigTab theme={currentTheme} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </PageLayout>
  );
}
