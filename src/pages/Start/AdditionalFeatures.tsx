import { Paper } from '@mui/material';
import { Speed, CloudSync, Notifications, Analytics } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { SvgIconComponent } from '@mui/icons-material';

interface HighlightItem {
  icon: SvgIconComponent;
  title: string;
  desc: string;
  color: string;
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    icon: Speed,
    title: 'Blitzschnell',
    desc: 'Optimierte Performance für ein flüssiges Erlebnis',
    color: '#a855f7',
  },
  {
    icon: CloudSync,
    title: 'Cloud-Sync',
    desc: 'Deine Daten auf allen Geräten synchronisiert',
    color: '#ec4899',
  },
  {
    icon: Notifications,
    title: 'Smart Notifications',
    desc: 'Benachrichtigungen für neue Episoden und Updates',
    color: '#f97316',
  },
  {
    icon: Analytics,
    title: 'Deep Analytics',
    desc: 'Umfassende Einblicke in deine Sehgewohnheiten',
    color: '#c084fc',
  },
];

const HighlightRow = ({ item, index }: { item: HighlightItem; index: number }) => {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
    >
      <div className="start-highlight-item">
        <div className="start-highlight-icon-box" style={{ background: `${item.color}12` }}>
          <Icon style={{ color: item.color, fontSize: 22 }} />
        </div>
        <div>
          <div className="start-highlight-title" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            {item.title}
          </div>
          <div className="start-highlight-desc" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            {item.desc}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AdditionalFeatures = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4, duration: 0.4 }}
  >
    <div className="start-highlights-section">
      <Paper
        elevation={0}
        className="start-highlights-paper"
        sx={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h2 className="start-highlights-heading" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Weitere Highlights
        </h2>

        <div className="start-highlights-grid">
          {HIGHLIGHTS.map((item, index) => (
            <HighlightRow key={item.title} item={item} index={index} />
          ))}
        </div>
      </Paper>
    </div>
  </motion.div>
);
