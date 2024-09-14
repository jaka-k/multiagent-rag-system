## https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_rag_agent_llama3_local.ipynb


from typing import Literal

from langchain_core.prompts import PromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI


### Edges


def grade_documents(state) -> Literal["generate", "rewrite"]:
    """
    Determines whether the retrieved documents are relevant to the question.

    Args:
        state (messages): The current state

    Returns:
        str: A decision for whether the documents are relevant or not
    """

    print("---CHECK RELEVANCE---")

    # Data model
    class grade(BaseModel):
        """Binary score for relevance check."""

        binary_score: str = Field(description="Relevance score 'yes' or 'no'")

    # LLM
    model = ChatOpenAI(temperature=0, model="gpt-4-0125-preview", streaming=True)

    # LLM with tool and validation
    llm_with_tool = model.with_structured_output(grade)

    # Prompt
    prompt = PromptTemplate(
        template="""You are a grader assessing relevance of a retrieved document to a user question. \n
        Here is the retrieved document: \n\n {context} \n\n
        Here is the user question: {question} \n
        If the document contains keyword(s) or semantic meaning related to the user question, grade it as relevant. \n
        Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.""",
        input_variables=["context", "question"],
    )

    # Chain
    chain = prompt | llm_with_tool

    messages = state["messages"]
    last_message = messages[-1]

    question = messages[0].content
    docs = last_message.content

    scored_result = chain.invoke({"question": question, "context": docs})

    score = scored_result

    if score == "yes":
        print("---DECISION: DOCS RELEVANT---")
        return "generate"

    else:
        print("---DECISION: DOCS NOT RELEVANT---")
        print(score)
        return "rewrite"


# def grade_documents_withweb(state):
#     """
#     Determines whether the retrieved documents are relevant to the question
#     If any document is not relevant, we will set a flag to run web search

#     Args:
#         state (dict): The current graph state

#     Returns:
#         state (dict): Filtered out irrelevant documents and updated web_search state
#     """

#     print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
#     question = state["question"]
#     documents = state["documents"]

#     # Score each doc
#     filtered_docs = []
#     web_search = "No"
#     for d in documents:
#         score = retrieval_grader.invoke(
#             {"question": question, "document": d.page_content}
#         )
#         grade = score["score"]
#         # Document relevant
#         if grade.lower() == "yes":
#             print("---GRADE: DOCUMENT RELEVANT---")
#             filtered_docs.append(d)
#         # Document not relevant
#         else:
#             print("---GRADE: DOCUMENT NOT RELEVANT---")
#             # We do not include the document in filtered_docs
#             # We set a flag to indicate that we want to run web search
#             web_search = "Yes"
#             continue
#     return {"documents": filtered_docs, "question": question, "web_search": web_search}
