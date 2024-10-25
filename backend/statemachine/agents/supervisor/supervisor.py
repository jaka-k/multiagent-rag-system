from langchain.output_parsers.openai_functions import JsonOutputFunctionsParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain


# Assume llm is an instance of a language model, e.g., OpenAI's GPT-3.5 Turbo
supervisor_prompt = """You are the supervisor agent. Based on the input, identify knowledge gaps and delegate tasks accordingly."""

supervisor_chain = LLMChain(
    llm=ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        stream_usage=True,
    ),
    prompt=PromptTemplate(supervisor_prompt),
)


def supervisor_agent(input_text):
    # Process input to identify knowledge gaps
    knowledge_gaps = identify_knowledge_gaps(input_text)

    # Prepare tasks for subgraphs
    tasks = [
        {
            "function_name": "create_flashcards",
            "arguments": {"knowledge_gaps": knowledge_gaps},
        },
        {
            "function_name": "conduct_web_research",
            "arguments": {"knowledge_gaps": knowledge_gaps},
        },
    ]

    # Dispatch tasks to subgraphs
    flashcards = create_flashcards_subgraph(tasks[0]["arguments"])
    articles = web_research_subgraph(tasks[1]["arguments"])

    # Return combined results
    return {"flashcards": flashcards, "articles": articles}


# SUPERVISORS
def create_flashcard_supervisor(llm: ChatOpenAI, system_prompt, members) -> str:
    """An LLM-based router."""
    options = ["FINISH"] + members
    # Aggregating Function Definitions: It collects the function_def from all sub-agents.
    function_def = {
        "name": "route",
        "description": "Select the next role.",
        "parameters": {
            "title": "routeSchema",
            "type": "object",
            "properties": {
                "next": {
                    "title": "Next",
                    "anyOf": [
                        {"enum": options},
                    ],
                },
            },
            "required": ["next"],
        },
    }
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="messages"),
            (
                "system",
                "Given the conversation above, who should act next?"
                " Or should we FINISH? Select one of: {options}",
            ),
        ]
    ).partial(options=str(options), team_members=", ".join(members))
    # Result Handling: The sub-agent processes the task and returns the result to the supervisor, which then forwards it to the requester.
    return (
        prompt
        | llm.bind_functions(functions=[function_def], function_call="route")
        | JsonOutputFunctionsParser()
    )
