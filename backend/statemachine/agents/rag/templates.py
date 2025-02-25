PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

### Answer question ###
SYSTEM_PROMPT = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer "
    "the question. If you don't know the answer, say that you "
    "don't know."
    "\n\n"
    "{context}"
    "---"
    "Answer the question based on the above context: {modified_input}"
)

### Contextualize question ###
CONTEXTUALIZE_Q_SYSTEM_PROMPT = (
    "Your task is to rewrite the user's input into a self-contained question that includes all necessary context from the chat history."
    "The reformulated question must be clear and independent, making sense without requiring access to the original chat history."
    "Additionally, identify and include any keywords, phrases, or tokens that could help enhance retrieval performance in a vector-based system."
    "Do NOT answer the question or provide explanations—focus solely on creating a standalone reformulated question with contextually useful tokens."
    "If the input is already self-contained, return it unchanged while appending any relevant keywords or phrases."
)
