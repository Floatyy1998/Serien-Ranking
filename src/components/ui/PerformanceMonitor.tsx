import { Box, Chip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface PerformanceStats {
  cacheHits: number;
  cacheMisses: number;
  firebaseReads: number;
  firebaseWrites: number;
  batches: number;
}

// Globaler Performance Tracker
class PerformanceTracker {
  private stats: PerformanceStats = {
    cacheHits: 0,
    cacheMisses: 0,
    firebaseReads: 0,
    firebaseWrites: 0,
    batches: 0,
  };

  private listeners: Array<(stats: PerformanceStats) => void> = [];

  trackCacheHit() {
    this.stats.cacheHits++;
    this.notifyListeners();
  }

  trackCacheMiss() {
    this.stats.cacheMisses++;
    this.notifyListeners();
  }

  trackFirebaseRead() {
    this.stats.firebaseReads++;
    this.notifyListeners();
  }

  trackFirebaseWrite() {
    this.stats.firebaseWrites++;
    this.notifyListeners();
  }

  trackBatch() {
    this.stats.batches++;
    this.notifyListeners();
  }

  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  getCacheEfficiency(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total > 0 ? Math.round((this.stats.cacheHits / total) * 100) : 0;
  }

  reset() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      firebaseReads: 0,
      firebaseWrites: 0,
      batches: 0,
    };
    this.notifyListeners();
  }

  subscribe(listener: (stats: PerformanceStats) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getStats()));
  }
}

export const performanceTracker = new PerformanceTracker();

// Development-only Performance Monitor Component
export const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>(
    performanceTracker.getStats()
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Nur in Development anzeigen
    if (process.env.NODE_ENV !== 'development') return;

    const unsubscribe = performanceTracker.subscribe(setStats);

    // Keyboard shortcut to toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Nur in Development und wenn sichtbar
  if (process.env.NODE_ENV !== 'development' || !visible) {
    return null;
  }

  const cacheEfficiency = performanceTracker.getCacheEfficiency();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: 2,
        borderRadius: 1,
        minWidth: 250,
        fontSize: '12px',
      }}
    >
      <Typography variant='h6' sx={{ fontSize: '14px', mb: 1 }}>
        🚀 Firebase Performance
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`Cache: ${cacheEfficiency}%`}
          size='small'
          color={
            cacheEfficiency > 70
              ? 'success'
              : cacheEfficiency > 40
              ? 'warning'
              : 'error'
          }
        />
        <Chip
          label={`Reads: ${stats.firebaseReads}`}
          size='small'
          color='info'
        />
        <Chip
          label={`Writes: ${stats.firebaseWrites}`}
          size='small'
          color='secondary'
        />
      </Box>

      <Box sx={{ fontSize: '11px', opacity: 0.8 }}>
        <div>Cache Hits: {stats.cacheHits}</div>
        <div>Cache Misses: {stats.cacheMisses}</div>
        <div>Batches: {stats.batches}</div>
      </Box>

      <Box sx={{ mt: 1, fontSize: '10px', opacity: 0.6 }}>
        Ctrl+Shift+P to toggle
      </Box>
    </Box>
  );
};

// Hook für Performance Tracking
export const usePerformanceTracking = () => {
  return {
    trackCacheHit: performanceTracker.trackCacheHit.bind(performanceTracker),
    trackCacheMiss: performanceTracker.trackCacheMiss.bind(performanceTracker),
    trackFirebaseRead:
      performanceTracker.trackFirebaseRead.bind(performanceTracker),
    trackFirebaseWrite:
      performanceTracker.trackFirebaseWrite.bind(performanceTracker),
    trackBatch: performanceTracker.trackBatch.bind(performanceTracker),
    getStats: performanceTracker.getStats.bind(performanceTracker),
    getCacheEfficiency:
      performanceTracker.getCacheEfficiency.bind(performanceTracker),
    reset: performanceTracker.reset.bind(performanceTracker),
  };
};
