import { logger } from '@lib/logger.ts'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const node = await import('./instrumentation.node.ts')
      logger.info('Successfully imported instrumentation.node.ts')
      node.register()
    } catch (error) {
      logger.error('Failed to import instrumentation.node.ts', error)
    }
  }
}
