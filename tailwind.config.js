/** @type {import('tailwindcss').Config} */
// Design tokens from docs/DESIGN.md section 1.2, applied verbatim (ESM form).
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { app: '#0B0D10', deep: '#080A0D', surface: '#10141A' },
        line: {
          faint: 'rgba(200,220,240,0.08)',
          DEFAULT: 'rgba(200,220,240,0.12)',
          strong: 'rgba(200,220,240,0.15)',
          emphasis: 'rgba(200,220,240,0.25)',
        },
        ink: {
          DEFAULT: '#E6ECF2',
          secondary: '#B9C4CE',
          muted: '#76828F',
          faint: '#5A6570',
          ghost: '#3D4650',
        },
        accent: { DEFAULT: '#FFB000', ink: '#0B0D10' },
        breath: { DEFAULT: '#9EB8C9' },
        success: '#63C68C',
        warning: '#FFB000',
        danger: '#FF5C33',
        effort: { easy: '#8FB3CC', ideal: '#FFB000', max: '#FF5C33' },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        ui: ['Archivo', 'sans-serif'],
      },
      fontSize: {
        // Display (Anton 400, uppercase, tabular-nums on numerals)
        'timer-xl': ['148px', { lineHeight: '1', letterSpacing: '0.02em' }], // rest timer
        'timer-lg': ['110px', { lineHeight: '1', letterSpacing: '0.02em' }], // set timer
        'timer-md': ['92px', { lineHeight: '1', letterSpacing: '0.02em' }], // breath stopwatch
        'display-lg': ['52px', { lineHeight: '1' }], // screen title (Legs A)
        'display-md': ['40px', { lineHeight: '0.95' }], // exercise name in player
        'display-sm': ['34px', { lineHeight: '1' }], // home header (Week 3/8)
        value: ['28px', { lineHeight: '1' }], // stepper values
        'display-xs': ['22px', { lineHeight: '1' }], // next-up name, list rows
        'btn-lg': ['20px', { lineHeight: '1', letterSpacing: '0.06em' }],
        btn: ['16px', { lineHeight: '1', letterSpacing: '0.06em' }],
        'btn-sm': ['14px', { lineHeight: '1', letterSpacing: '0.06em' }],
        // UI (Archivo)
        body: ['13px', { lineHeight: '1.45' }],
        meta: ['12px', { lineHeight: '1.4' }],
        label: ['11px', { lineHeight: '1', letterSpacing: '0.14em' }], // section labels
        'label-sm': ['10px', { lineHeight: '1', letterSpacing: '0.14em' }],
        'label-xs': ['9px', { lineHeight: '1', letterSpacing: '0.14em' }],
      },
      borderRadius: { xs: '3px', sm: '4px' },
      boxShadow: {
        breath: '0 0 60px rgba(158,184,201,0.12)',
        'text-photo': '0 2px 30px rgba(11,13,16,0.7)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        breath: 'cubic-bezier(0.37, 0, 0.63, 1)',
      },
      transitionDuration: { tap: '120ms', state: '200ms', screen: '300ms', phase: '500ms' },
      zIndex: { tabbar: '10', scrim: '30', sheet: '40', toast: '50' },
    },
  },
  plugins: [],
};
