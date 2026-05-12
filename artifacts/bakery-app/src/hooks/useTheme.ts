import { useState, useEffect } from 'react';

/** Reactively tracks whether the `.dark` class is on <html>. */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains('dark'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/** Returns recharts-friendly theme colours that flip with dark/light mode. */
export function useChartTheme() {
  const isDark = useIsDark();
  return {
    axis:          isDark ? 'rgba(255,255,255,0.38)' : 'rgba(30,18,6,0.52)',
    grid:          isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    legend:        isDark ? 'rgba(255,255,255,0.7)'  : 'rgba(20,12,4,0.75)',
    cursor:        isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    tooltipBg:     isDark ? 'rgba(15,8,2,0.97)'      : 'rgba(255,253,248,0.98)',
    tooltipBorder: 'rgba(212,168,68,0.35)',
    tooltipColor:  isDark ? '#e8dcc8'                : '#1a1208',
    cardBorder:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  };
}
