import { Box, Paper, Typography } from '@mui/material';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconColor: string;
  subValue?: string;
  onClick?: () => void;
}

export const StatCard = ({ icon, label, value, iconColor, subValue, onClick }: StatCardProps) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2,
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: onClick ? 'pointer' : 'default',
      '&:active': {
        transform: 'scale(0.97)',
      },
      '&:hover': onClick
        ? {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 20px -5px ${iconColor}18`,
            borderColor: `${iconColor}25`,
          }
        : {},
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)`,
        pointerEvents: 'none',
      },
    }}
  >
    {/* Ambient color glow */}
    <Box
      sx={{
        position: 'absolute',
        top: -25,
        right: -25,
        width: 90,
        height: 90,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${iconColor}18 0%, transparent 70%)`,
        filter: 'blur(25px)',
      }}
    />

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${iconColor}1a 0%, ${iconColor}0a 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          border: `1px solid ${iconColor}15`,
        }}
      >
        {icon}
      </Box>
    </Box>

    <Typography
      variant="h5"
      sx={{
        fontWeight: 700,
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text-primary)',
        fontSize: '1.3rem',
        mb: 0.5,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </Typography>

    <Typography
      variant="caption"
      sx={{
        color: 'var(--color-text-muted)',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        opacity: 0.7,
      }}
    >
      {label}
    </Typography>

    {subValue && (
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: 'var(--color-text-secondary)',
          fontSize: '0.65rem',
          mt: 0.5,
          opacity: 0.8,
        }}
      >
        {subValue}
      </Typography>
    )}
  </Paper>
);
