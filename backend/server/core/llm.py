from langchain_openai import ChatOpenAI

from server.core.config import CHAT_PROVIDER_PREFS, OPENROUTER_BASE_URL, settings
from server.core.exceptions import LlmConfigError


def build_chat_model(model: str, temperature: float = 0) -> ChatOpenAI:
    if not settings.openrouter_api_key:
        raise LlmConfigError("OPENROUTER_API_KEY is not set")
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=settings.openrouter_api_key,
        base_url=OPENROUTER_BASE_URL,
        extra_body={"provider": CHAT_PROVIDER_PREFS},
    )
