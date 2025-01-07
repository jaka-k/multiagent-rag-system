import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({
    serviceName: 'mrag-client',
    traceExporter: new OTLPTraceExporter({
      url: 'grpc://otel-collector:4317'
    })
  })
}
