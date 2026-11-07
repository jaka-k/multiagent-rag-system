import { logger } from '@lib/logger.ts'

export async function register() {
  // Tracing is opt-in, same switch as the backend: without a collector the
  // exporter would only produce connection errors.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.OTEL_ENABLED === 'true'
  ) {
    try {
      const node = await import('./instrumentation.node.ts')
      logger.info('Successfully imported instrumentation.node.ts')
      node.register()
    } catch (error) {
      logger.error({ err: error }, 'Failed to import instrumentation.node.ts')
    }
  }
}
