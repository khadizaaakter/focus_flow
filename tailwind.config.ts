import type { Config } from 'tailwindcss'

// The @nuxtjs/tailwindcss module only scans components/, layouts/, pages/, etc.
// Our Daily Planner lives in app/resources/, so we add it here explicitly —
// otherwise classes used only there never get compiled into CSS.
export default <Partial<Config>>{
  content: {
    files: ['app/resources/**/*.{vue,js,jsx,mjs,ts,tsx}'],
  },
}
