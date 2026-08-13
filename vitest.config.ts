import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    /* Only the front end's suite. `server/` is a separate package and runs on
       the node:test runner (`npm run test:phone` in there). */
    include: ['tests/**/*.test.ts'],
  },
})
