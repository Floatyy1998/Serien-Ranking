import { Save } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';

interface ConfigTabProps {
  theme: {
    primary: string;
    text: { secondary: string; muted: string };
    background: { surface: string; default: string };
    status: { success: string; error: string };
  };
}

interface PetDropConfig {
  dropChance: number;
  rarityWeights: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

const DEFAULTS: PetDropConfig = {
  dropChance: 0.045,
  rarityWeights: { common: 45, uncommon: 30, rare: 15, epic: 8, legendary: 2 },
};

export function ConfigTab({ theme }: ConfigTabProps) {
  const [config, setConfig] = useState<PetDropConfig>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firebase
      .database()
      .ref('admin/config/petDrops')
      .once('value')
      .then((snap) => {
        if (snap.exists()) {
          const val = snap.val();
          setConfig({
            dropChance: val.dropChance ?? DEFAULTS.dropChance,
            rarityWeights: { ...DEFAULTS.rarityWeights, ...val.rarityWeights },
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = useCallback(async () => {
    await firebase.database().ref('admin/config/petDrops').set(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [config]);

  const updateWeight = (key: keyof PetDropConfig['rarityWeights'], value: number) => {
    setConfig((prev) => ({
      ...prev,
      rarityWeights: { ...prev.rarityWeights, [key]: value },
    }));
  };

  if (loading) return <p style={{ color: theme.text.muted }}>Laden...</p>;

  const inputStyle = {
    background: theme.background.default,
    color: theme.text.secondary,
    border: `1px solid ${theme.text.muted}30`,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    width: '100px',
  };

  const labelStyle = {
    color: theme.text.secondary,
    fontSize: '14px',
    fontWeight: 600 as const,
    minWidth: '120px',
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  };

  const total = Object.values(config.rarityWeights).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h3 style={{ color: theme.text.secondary, margin: '0 0 20px', fontSize: '18px' }}>
        Pet Accessory Drops
      </h3>

      <div
        style={{
          background: theme.background.surface,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <h4 style={{ color: theme.text.secondary, margin: '0 0 16px', fontSize: '15px' }}>
          Drop-Chance pro Episode
        </h4>
        <div style={rowStyle}>
          <span style={labelStyle}>Chance</span>
          <input
            type="number"
            step="0.005"
            min="0"
            max="1"
            value={config.dropChance}
            onChange={(e) =>
              setConfig((p) => ({ ...p, dropChance: parseFloat(e.target.value) || 0 }))
            }
            style={inputStyle}
          />
          <span style={{ color: theme.text.muted, fontSize: '13px' }}>
            = {(config.dropChance * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div
        style={{
          background: theme.background.surface,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ color: theme.text.secondary, margin: '0 0 16px', fontSize: '15px' }}>
          Rarity Weights
        </h4>
        {(
          [
            ['common', 'Gewöhnlich', '#9E9E9E'],
            ['uncommon', 'Ungewöhnlich', '#4CAF50'],
            ['rare', 'Selten', '#2196F3'],
            ['epic', 'Episch', '#9C27B0'],
            ['legendary', 'Legendär', '#FF9800'],
          ] as const
        ).map(([key, label, color]) => (
          <div key={key} style={rowStyle}>
            <span style={{ ...labelStyle, color }}>{label}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={config.rarityWeights[key]}
              onChange={(e) => updateWeight(key, parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
            <span style={{ color: theme.text.muted, fontSize: '13px' }}>
              = {total > 0 ? ((config.rarityWeights[key] / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          borderRadius: '10px',
          border: 'none',
          background: saved ? theme.status.success : theme.primary,
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Save style={{ fontSize: 18 }} />
        {saved ? 'Gespeichert!' : 'Speichern'}
      </button>

      <p style={{ color: theme.text.muted, fontSize: '12px', marginTop: '12px' }}>
        Änderungen gelten sofort für Frontend und Extension.
      </p>
    </div>
  );
}
