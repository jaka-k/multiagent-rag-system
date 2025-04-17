import { context, trace } from '@opentelemetry/api'
import pino from 'pino'

const logger = pino({
  name: 'mrag-client',
  base: {
    service: 'mrag-client'
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
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export { logger }
