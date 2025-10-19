import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Declare global gtag function for TypeScript
declare global {
  const gtag: (command: string, action: string, parameters: any) => void;
}

interface VitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Web Vitals thresholds
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(vitals: VitalsData) {
  // In production, you might send to Google Analytics, Datadog, or similar
  if (import.meta.env.MODE === 'development') {
    console.log('Web Vitals:', {
      metric: vitals.name,
      value: vitals.value,
      rating: vitals.rating,
      delta: vitals.delta,
      id: vitals.id
    });
  }

  // Example: Send to Google Analytics 4
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', vitals.name, {
      value: Math.round(vitals.name === 'CLS' ? vitals.value * 1000 : vitals.value),
      event_category: 'Web Vitals',
      event_label: vitals.id,
      non_interaction: true,
    });
  }

  // Example: Send to custom analytics endpoint
  // fetch('/api/analytics/vitals', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(vitals)
  // }).catch(console.error);
}

export function WebVitals() {
  useEffect(() => {
    async function initWebVitals() {
      try {
        const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

        // Core Web Vitals
        onCLS((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

        onFID((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

        onLCP((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

        // Additional metrics
        onFCP((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

        onTTFB((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

        // Track Interaction to Next Paint (INP)
        onINP((vitals: Metric) => {
          const data: VitalsData = {
            ...vitals,
            rating: getRating(vitals.name, vitals.value)
          };
          sendToAnalytics(data);
        });

      } catch (error) {
        console.warn('Web Vitals library not available:', error);
      }
    }

    // Only track vitals in production or when explicitly enabled
    if (import.meta.env.MODE === 'production' || import.meta.env.VITE_TRACK_VITALS === 'true') {
      initWebVitals();
    }
  }, []);

  return null; // This component doesn't render anything
}

// Performance observer for custom metrics
export function observePerformance() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Observe Long Tasks (for debugging)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('Long Task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task API not supported
  }

  // Observe Navigation Timing
  try {
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('Navigation Timing:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          totalTime: navEntry.loadEventEnd - navEntry.fetchStart
        });
      }
    });
    navObserver.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    // Navigation timing API not supported
  }
}