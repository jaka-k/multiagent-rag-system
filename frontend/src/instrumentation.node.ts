import { credentials } from '@grpc/grpc-js'
import { logger } from '@lib/logger.ts'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor
} from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

export function register() {
  const traceExporter = new OTLPTraceExporter({
    url: 'otelcol:4317',
    credentials: credentials.createInsecure()
  })

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'mrag-client'
    }),
    spanProcessors: [
      new BatchSpanProcessor(traceExporter),
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    ],
    instrumentations: [new PinoInstrumentation(), new UndiciInstrumentation()]
  })

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => logger.info('Tracing terminated'))
      .catch((error) => logger.error('Error terminating tracing', error))
      .finally(() => process.exit(0))
  })

  sdk.start()
}
