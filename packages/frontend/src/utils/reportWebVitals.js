/**
 * Web Vitals Reporting
 * Reports Core Web Vitals metrics for performance monitoring
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * Report Web Vitals metrics
 * @param {Function} onPerfEntry - Callback to handle metrics
 */
export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Cumulative Layout Shift
    onCLS(onPerfEntry);

    // Interaction to Next Paint
    onINP(onPerfEntry);

    // First Contentful Paint
    onFCP(onPerfEntry);

    // Largest Contentful Paint
    onLCP(onPerfEntry);

    // Time to First Byte
    onTTFB(onPerfEntry);
  }
}

/**
 * Log metrics to console (development only)
 * @param {Object} metric - Web Vitals metric object
 */
export function logMetric(metric) {
  const { name, value, rating, delta } = metric;

  // Color code based on rating
  const colors = {
    good: 'color: #0CCE6B',
    'needs-improvement': 'color: #FFA400',
    poor: 'color: #FF4E42',
  };

  console.log(
    `%c${name}: ${value.toFixed(2)}ms (${rating})`,
    colors[rating] || 'color: #666'
  );

  // Log details in development
  if (import.meta.env.DEV) {
    console.log(`  Delta: ${delta.toFixed(2)}ms`);
    console.log(`  Rating: ${rating}`);
  }
}

/**
 * Send metrics to analytics (production)
 * @param {Object} metric - Web Vitals metric object
 */
export function sendToAnalytics(metric) {
  const { name, value, rating, id } = metric;

  // Example: Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(value),
      rating,
      non_interaction: true,
    });
  }

  // Example: Send to custom analytics endpoint
  if (import.meta.env.PROD) {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        rating,
        id,
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail if analytics endpoint unavailable
    });
  }
}

/**
 * Default handler: log in dev, send to analytics in prod
 * @param {Object} metric - Web Vitals metric object
 */
export function handleMetric(metric) {
  if (import.meta.env.DEV) {
    logMetric(metric);
  } else {
    sendToAnalytics(metric);
  }
}

/**
 * Get performance thresholds for each metric
 * Based on Chrome's Core Web Vitals thresholds
 * @returns {Object} Thresholds object
 */
export function getThresholds() {
  return {
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };
}

/**
 * Check if metric meets "good" threshold
 * @param {Object} metric - Web Vitals metric
 * @returns {boolean} True if metric is "good"
 */
export function isGoodMetric(metric) {
  return metric.rating === 'good';
}

/**
 * Get all metrics summary
 * Collects all metrics and returns summary
 * @returns {Promise<Object>} Summary of all metrics
 */
export async function getMetricsSummary() {
  return new Promise((resolve) => {
    const metrics = {};
    let count = 0;
    const expectedMetrics = 5; // CLS, INP, FCP, LCP, TTFB

    const collectMetric = (metric) => {
      metrics[metric.name] = {
        value: metric.value,
        rating: metric.rating,
      };
      count++;

      if (count === expectedMetrics) {
        resolve(metrics);
      }
    };

    reportWebVitals(collectMetric);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (count < expectedMetrics) {
        resolve(metrics);
      }
    }, 10000);
  });
}
