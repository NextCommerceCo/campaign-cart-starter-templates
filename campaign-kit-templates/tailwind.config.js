module.exports = {
  // Update to your slug: './src/[your-slug]/**/*.html'
  content: ['./src/landing/**/*.html', './src/presell/**/*.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        'brand-primary':   'var(--brand-primary)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-accent':    'var(--brand-accent)',
        'surface-bg':      'var(--surface-bg)',
        'surface-card':    'var(--surface-card)',
        'surface-alt':     'var(--surface-alt)',
        'text-primary':    'var(--text-primary)',
        'text-secondary':  'var(--text-secondary)',
        'text-inverse':    'var(--text-inverse)',
      },
    },
  },
  plugins: [],
}
