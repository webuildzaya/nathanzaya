import { defineConfig } from 'prisma/config'

// Load environment variables locally. In production (e.g., Vercel),
// dotenv is stripped as a devDependency and env vars are injected directly.
try {
  const { config } = require('dotenv')
  config({ path: '.env.local' })
  config()
} catch (error) {
  // Ignore error if dotenv is missing
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
})
