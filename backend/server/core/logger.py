import logging

from server.core.config import settings

# APP logging — always available regardless of OTEL config
app_logger = logging.getLogger("uvicorn.mrag-server")
app_logger.setLevel(logging.INFO)
app_logger.propagate = True

if settings.otel_enabled:
    from opentelemetry._logs import set_logger_provider
    from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
    from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
    from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
    from opentelemetry.sdk.resources import Resource

    resource = Resource.create({"service.name": "mrag-server"})
    logger_provider = LoggerProvider(resource=resource)
    set_logger_provider(logger_provider)

    exporter = OTLPLogExporter(endpoint=settings.otel_endpoint, insecure=True)
    processor = BatchLogRecordProcessor(exporter)
    logger_provider.add_log_record_processor(processor)

    otel_logging_handler = LoggingHandler(
        level=logging.INFO,
        logger_provider=logger_provider,
    )

    app_logger.addHandler(otel_logging_handler)
    logging.getLogger("uvicorn.error").addHandler(otel_logging_handler)
    logging.getLogger("uvicorn.access").addHandler(otel_logging_handler)
