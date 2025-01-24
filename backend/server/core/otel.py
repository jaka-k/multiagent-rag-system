from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import get_tracer_provider, set_tracer_provider


def init_telemetry(app):
    tracer_provider = TracerProvider(resource=Resource.create(attributes={"service.name": "mrag-server"}))
    set_tracer_provider(tracer_provider)
    span_processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="localhost:4317", insecure=True))
    tracer_provider.add_span_processor(span_processor)

    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=get_tracer_provider()
    )
