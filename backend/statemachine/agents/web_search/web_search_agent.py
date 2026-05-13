## SHOULD USE https://python.langchain.com/docs/integrations/document_loaders/reddit/
## AND https://python.langchain.com/docs/integrations/tools/google_search/
class WebSearchAgent:
    async def invoke(self, state: dict) -> dict:
        state["web_search_result"] = "Search results retrieved."
        return state