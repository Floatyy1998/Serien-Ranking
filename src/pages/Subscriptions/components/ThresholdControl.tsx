import { useTheme } from '../../../contexts/ThemeContext';

interface ThresholdControlProps {
  unusedThresholdDays: number;
  onThresholdChange: (days: number) => void;
}

/** Schwellenwert-Steuerung: ab wie vielen Tagen Inaktivität ein Abo als ungenutzt gilt. */
export const ThresholdControl = ({
  unusedThresholdDays,
  onThresholdChange,
}: ThresholdControlProps) => {
  const { currentTheme } = useTheme();

  const surface = currentTheme.background.surface;
  const border = currentTheme.border.default;
  const muted = currentTheme.text.muted;

  return (
    <div
      className="sub-threshold-row"
      style={{
        background: surface,
        borderColor: border,
        color: currentTheme.text.primary,
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Schwellenwert</p>
        <p style={{ margin: '2px 0 0 0', fontSize: 12, color: muted }}>
          Abo gilt als ungenutzt nach
        </p>
      </div>
      <input
        type="number"
        min={7}
        max={365}
        value={unusedThresholdDays}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v)) onThresholdChange(v);
        }}
        className="sub-threshold-input"
        style={{ color: currentTheme.text.primary, borderColor: border }}
      />
      <span style={{ fontSize: 13, color: muted }}>Tagen</span>
    </div>
  );
};
