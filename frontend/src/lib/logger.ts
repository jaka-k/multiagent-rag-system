import { context, trace } from '@opentelemetry/api'
import pino from 'pino'

const logger = pino({
  name: 'mrag-client',
  base: {
    service: 'mrag.client'
  },
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `,"ts":"${new Date().toISOString()}"`,
  formatters: {
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
        node_version: process.version
      }
    },
    level: (label) => {
      return {
        level: label.toUpperCase()
      }
    },
    log: (log) => {
      const activeSpan = trace.getSpan(context.active())

      if (activeSpan) {
        const spanContext = activeSpan.spanContext()
        return {
          ...log,
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId
        }
      }

      return log
    }
  },
  // Pretty output for local development only. In production pino writes plain
  // JSON lines to stdout, which is what log collectors expect (and pino-pretty
  // is a dev dependency, so it isn't in the production image).
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  })
})

export { logger }
