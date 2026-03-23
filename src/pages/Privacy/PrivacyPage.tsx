import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { Shield } from '@mui/icons-material';
import { usePrivacyData } from './usePrivacyData';
import {
  ResponsibleSection,
  DataCollectionSection,
  FirebaseSection,
  ApiServicesSection,
  RightsSection,
  TextSection,
  ContactSection,
} from './PrivacyComponents';
import './PrivacyPage.css';

export const PrivacyPage = () => {
  const { currentTheme } = useTheme();
  const { data, loading } = usePrivacyData();

  if (loading) {
    return (
      <div className="priv-loading" style={{ background: currentTheme.background.default }}>
        <LoadingSpinner size={50} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="priv-error" style={{ background: currentTheme.background.default }}>
        <div className="priv-error-icon">
          <Shield style={{ fontSize: 36, opacity: 0.4, color: currentTheme.text.secondary }} />
        </div>
        <p className="priv-error-text" style={{ color: currentTheme.text.secondary }}>
          Datenschutzinformationen konnten nicht geladen werden.
        </p>
      </div>
    );
  }

  return (
    <div className="priv-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div className="priv-bg-decoration">
        <div
          className="priv-bg-orb"
          style={{
            background: `radial-gradient(ellipse, ${currentTheme.primary}10 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Header */}
      <PageHeader
        title={data.title}
        icon={<Shield style={{ fontSize: 22, color: currentTheme.primary }} />}
      />

      {/* Content */}
      <div className="priv-content">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="priv-last-updated"
          style={{ color: currentTheme.text.secondary }}
        >
          {data.lastUpdated}
        </motion.p>

        <ResponsibleSection data={data.sections.responsible} />
        <DataCollectionSection data={data.sections.dataCollection} />
        <FirebaseSection data={data.sections.firebase} />
        <ApiServicesSection data={data.sections.apiServices} />
        <RightsSection data={data.sections.rights} />
        <TextSection title={data.sections.deletion.title} text={data.sections.deletion.text} />
        <TextSection title={data.sections.security.title} text={data.sections.security.text} />
        <TextSection title={data.sections.changes.title} text={data.sections.changes.text} />
        <ContactSection data={data.sections.contact} />
      </div>
    </div>
  );
};
