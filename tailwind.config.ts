import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: {
    files: ['app/**/*.{vue,js,jsx,mjs,ts,tsx}'],
  },
}
