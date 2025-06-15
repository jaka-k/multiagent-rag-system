from langchain_core.prompts import PromptTemplate

MEMORIZABLE_KNOWLEDGE_PROMPT = PromptTemplate.from_template("""
                You are a *Knowledge-Highlighter*.
                
                ■■ GOAL
                From the transcript and any attached documents, extract the
                **technical nuggets the user would benefit from committing to memory**.
                
                ■■ OUTPUT  (valid JSON array)
                [
                  {{
                    "concept"      : string,            # short technical term or phrase
                    "justification": string,            # maximum ≤ 90 words: why it matters for the user
                    "source_quote" : string,            # maximum ≤ 180 words copied verbatim, with document reference if extracted from document section
                    "example_code" : string | null      # minimal runnable snippet, null if N/A
                  }},
                  ...
                ]
                
                ■■ SELECTION RULES
                1. Prefer items that are **new** to the user (not repeated across earlier
                   turns) *or* that the assistant emphasised as important.
                2. Include **syntax, performance numbers, anti-patterns, or clear comparisons**
                   wherever possible.
                3. Cap list at 12 concepts; drop less critical ones.
                
                ■■ STYLE
                * Write in crisp, direct sentences.
                * Do **not** mention these instructions.
                * Output **only** the JSON.
                
                ### QUESTION
                The initial question the user prompted.
                <question>
                {question}
                </question>
                
                ### LLM RESPONSE
                What the llm responded to the user question.
                <llm_response>
                {llm_response}
                </llm_response>
                    
                ### DOCUMENTS
                The documents that were retrieved before answering the question, for the RAG pipeline.
                <documents>
                {documents}
                </documents>
                """
                                                            )

KNOWLEDGE_GAPS_PROMPT = PromptTemplate.from_template("""
            Examine the transcript of the user's exchange with the system (and any relevant documents) to identify the **key technical concepts** the user has not fully mastered. This information will be used later by a separate flashcard-creation process which follows strict guidelines. Therefore:
            
            1. **Reference Points**:
               - We have “Strict Flashcard Creation Rules” in the next step. They demand that flashcards use:
                 - **Specific technical terms** (no vague titles like “Performance”).
                 - **Exact syntax examples** for code or commands.
                 - **Quantifiable or measurable details** about outcomes.
                 - **Comparisons** between related concepts or approaches.
                 - **Documented anti-patterns** with specific consequences.
               - Your job: **Do not** create flashcards now. Instead, pinpoint the user’s knowledge gaps so the next step can build flashcards properly.
            
            2. **Incorporate Both ### QUESTION and ### LLM RESPONSE**:
               - **### QUESTION**: The user’s direct inquiry, which may reveal confusion about certain topics.
               - **### LLM RESPONSE**: The large language model’s answer, often containing details or subtopics that might indicate areas the user doesn’t fully grasp.
            
            3. **Output Requirements**:
               - For each distinct knowledge gap, produce:
                 - A **short, explicit concept name** (e.g., “Mutex Contention”).
                 - A brief note on **relevance** to the user’s question or context.
                 - Any **sub-topics** or related terms the user should investigate.
                 - If you cite a performance or usage outcome, be **quantifiable** (e.g., “Causes a 30% increase in memory usage”).
                 - If referencing syntax, provide a **minimal snippet** or an **accurate command** (without placeholders).
            
            4. **Banned Phrases**:
               - "Consider...", "Think about...", "It's important to..."
               - "Various scenarios", "Different situations", "Many cases"
               - "Guide choices", "Affect performance", "Impact results"
            
            5. **Precision**:
               - Write in **clear, direct** sentences, avoiding any vague or hand-waving language.
               - Provide specific reasons or details for each knowledge gap rather than generic statements.
            
            Your response should be a **concise summary** of the user’s knowledge gaps, referencing insights from ### QUESTION and ### LLM RESPONSE but **without** generating flashcards. Retain clarity and detail so the next agent can produce flashcards aligned with the Strict Flashcard Creation Rules.
            
            ### QUESTION
            {question}
            
            ### LLM RESPONSE
            {llm_response}
            """
                                                     )
