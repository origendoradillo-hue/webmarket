export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

type GtagFn = (...args: unknown[]) => void;
type AnalyticsWindow = Window & { gtag?: GtagFn; dataLayer?: unknown[] };

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;
  if (typeof w.gtag === "function") {
    w.gtag("event", name, params);
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: name, ...params });
  }
}
