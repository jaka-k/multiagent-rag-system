import json
import urllib.request
from typing import Any, Dict

from server.core.config import settings


def _build_request(action: str, **params) -> Dict[str, Any]:
    return {"action": action, "params": params, "version": 6}


def invoke(action: str, **params) -> Dict[str, Any]:
    if not settings.anki_url:
        raise RuntimeError("ANKI_URL is not configured. Set it in your .env file.")
    request_json = json.dumps(_build_request(action, **params)).encode("utf-8")
    try:
        with urllib.request.urlopen(
            urllib.request.Request(settings.anki_url, request_json)
        ) as response:
            response_data = json.load(response)
    except Exception as e:
        raise ConnectionError(f"Failed to connect to AnkiConnect: {e}")

    # Include the necessary checks
    if not isinstance(response_data, dict):
        raise ValueError("Invalid response format from AnkiConnect")
    if len(response_data) != 2:
        raise ValueError("Response has an unexpected number of fields")
    if "error" not in response_data:
        raise ValueError("Response is missing required 'error' field")
    if "result" not in response_data:
        raise ValueError("Response is missing required 'result' field")

    return response_data
