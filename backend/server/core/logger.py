import logging

from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import (
    OTLPLogExporter,
)
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

logging.basicConfig(
    filename='app.log',
    filemode='a',
    encoding="utf-8",
    style="{",
    datefmt='%H:%M:%S',
    level=logging.INFO
)
logging.Formatter('%(asctime)s %(clientip)-15s %(user)-8s %(message)s')

resource = Resource.create(
    {
        "service.name": "mrag-server",
    }
)

logger_provider = LoggerProvider(resource=resource)
set_logger_provider(logger_provider)

exporter = OTLPLogExporter(endpoint="localhost:4317", insecure=True)
processor = BatchLogRecordProcessor(exporter)
logger_provider.add_log_record_processor(processor)

otel_logging_handler = LoggingHandler(
    level=logging.INFO,
    logger_provider=logger_provider
)

app_logger = logging.getLogger("mrag-server")
app_logger.setLevel(logging.INFO)
app_logger.addHandler(otel_logging_handler)

uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.setLevel(logging.INFO)
uvicorn_access_logger.addHandler(otel_logging_handler)
