/**
 * Wrapped Calculator - Re-export aus aufgeteilten Modulen
 *
 * Dieser Re-Export stellt sicher, dass bestehende Imports weiterhin funktionieren.
 */

import { calculateWrappedStats } from './wrapped';

export { calculateWrappedStats };

export default {
  calculateWrappedStats,
};
