import logging

from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import (
    OTLPLogExporter,
)
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

# OTEL Setup
resource = Resource.create({"service.name": "mrag-server"})
logger_provider = LoggerProvider(resource=resource)
set_logger_provider(logger_provider)

exporter = OTLPLogExporter(endpoint="localhost:4317", insecure=True)
processor = BatchLogRecordProcessor(exporter)
logger_provider.add_log_record_processor(processor)

otel_logging_handler = LoggingHandler(
    level=logging.INFO,
    logger_provider=logger_provider
)

# APP logging
app_logger = logging.getLogger("uvicorn.mrag-server")
app_logger.setLevel(logging.INFO)

app_logger.propagate = True

app_logger.addHandler(otel_logging_handler)

uvicorn_error_logger = logging.getLogger("uvicorn.error")
uvicorn_error_logger.addHandler(otel_logging_handler)

uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.addHandler(otel_logging_handler)
