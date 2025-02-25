# Create Subgraph 2 - Web Research

# Agent: Web Research Agent
# Role:

# Searches the web for articles that explain the knowledge gaps.
# Returns a list of article titles and URLs.
# Implementation Details:

# Use Tools like SerpAPIWrapper or BingSearchAPI within LangChain.
# Wrap the search tool in an AgentExecutor or use an LLMChain to process and format results.
# API References:

# SerpAPIWrapper
# Tool


web_research_function = {
    "name": "conduct_web_research",
    "description": "Finds articles explaining the knowledge gaps.",
    "parameters": {
        "type": "object",
        "properties": {
            "knowledge_gaps": {
                "type": "string",
                "description": "The knowledge gaps identified.",
            }
        },
        "required": ["knowledge_gaps"],
    },
}
