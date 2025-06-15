from langchain_core.prompts import PromptTemplate

KNOWLEDGE_TO_CARDS_PROMPT_V2 = """
                                You are a *Flash-card Concept Builder*.
                                
                                INPUT
                                ------
                                {knowledge_nuggets}            # JSON array of knowledge nuggets (concept, quote, etc.)
                                
                                OUTPUT
                                ------
                                Return a JSON array that passes the enforced schema.
                                The LLM runtime will validate it, so field names and types must match.
                                
                                WRITING RULES
                                1. **Front term** = `concept` value → must be specific (e.g. "Mutex Contention", never "Performance").
                                2. **Definition**: ≤60 words, <u>underline</u> the 2-3 most critical terms.
                                3. **Example**: provide runnable snippet *if the concept involves code or CLI*.
                                4. If the concept has a known pitfall, fill `anti_pattern` with a one-line error scenario **and** a corrective note; otherwise omit.
                                5. Add `performance` only when a quantitative fact exists; otherwise omit.
                                6. Use short, direct sentences; omit hedging words.
                                7. No banned-phrases list—just follow the positive examples below.
                                8. If source quote has document citation/reference include it in the source field; otherwise omit.
                                
                                GOOD EXAMPLE
                                ```json
                                [{{
                                  "concept": "Read-Write Lock",
                                  "category": "Concurrency API",
                                  "definition": "<u>Readers–Writers</u> lock lets many goroutines read while one writes",
                                  "example": "var mu sync.RWMutex\nmu.RLock(); v := data; mu.RUnlock()",
                                  "anti_pattern": "Using RWMutex for single-thread code → adds 20 % overhead",
                                  "performance": "Write locks block all readers; benchmark shows 3× slowdown at 8 writers",
                                  "contrast_pair": "sync.Mutex",
                                  "source": "Go Cookbook - Chapter 3 - Concurrency"
                                }}]
                                ```
                                Return only the JSON array, nothing else.
                                """

KNOWLEDGE_IDENTIFICATION_PROMPT = """Given the user's knowledge gaps below:
                {knowledge_nuggets}
                
                Generate a JSON array of key concepts for flashcard creation. Follow these **Strict Flashcard Creation Rules**:
                
                1. **Card Content Requirements**:
                   - **Front**: Must contain a **specific technical term** (e.g., "Mutex Contention" rather than "Performance").
                   - **Back**: Must include:
                     - Exact syntax or semantic differences.
                     - Code snippets showing _specific_ usage.
                     - Clear comparisons between alternatives.
                     - Documented consequences for anti-patterns.
                
                2. **Anti-Vagueness Rules**:
                   BANNED PHRASES:
                   - "Consider...", "Think about...", "It's important to..."
                   - "Various scenarios", "Different situations", "Many cases"
                   - "Guide choices", "Affect performance", "Impact results"
                
                   Good example:
                   - "When <condition>, use <pattern> because <reason>"
                
                   Bad example:
                   - "Pattern used in various scenarios"
                
                3. **Mandatory Elements** (each flashcard must include all):
                   - Technical term in **bold** as the first line in the definition.
                   - A code example showing a minimum working pattern.
                   - An anti-pattern with a specific error example.
                   - A performance characteristic (e.g., O(n) complexity, or "40% latency increase in benchmark").
                
                4. **General Rules**:
                   - **Structure**: Each concept must be an object with:
                     - `"concept"`: Short name (e.g., "Multi-stage Builds")
                     - `"category"`: One of [Syntax/APIs, Architectural Components, Patterns/Anti-Patterns, Ecosystem Tools, Security/Debugging]
                     - `"definition"`: Concise explanation with <u>key terms</u> underlined using HTML. Expand only when necessary for clarity.
                     - `"example"`: Code/config snippet or scenario demonstrating usage.
                     - `"anti_pattern"`: Common mistake to avoid (if applicable).
                
                   - **Prioritization**:
                     - Focus on concepts addressing the user’s knowledge gaps first.
                     - Include foundational concepts before advanced topics (e.g., “Containers vs. Images” before “Orchestration”).
                
                   - **Memorization Hooks**:
                     - Highlight syntax differences (e.g., CLI flags `-v` vs `--volume`).
                     - Provide contrast pairs (e.g., "Bind Mounts ↔ Volumes").
                     - Offer pattern recognition cues (e.g., "All Docker Compose services share network by default").
                
                   - **Cognitive Optimization**:
                     - **Chunking**: Split complex concepts into separate atomic flashcards.
                     - **Dual Coding**: Combine technical terms with concrete analogies (e.g., “Namespaces – Process isolation 'sandboxes'”).
                     - **Interleaving**: Mix categories to avoid monotony.
                     - **Von Restorff Effect**: Highlight unusual or special syntax (e.g., `--security-opt seccomp=unconfined`).
                
                5. **Validation Rules**:
                   - Every tool-related concept must reference its primary category or component.
                   - Security concepts require explicit anti-pattern consequences.
                   - Syntax cards must show one correct and one incorrect variation.
                   - Architectural components should include a real-world analogy and mention “diagram” or “diagram keywords”.
                
                6. **Example Output** (Ensure your output follows EXACTLY this JSON structure — an array of objects):
                ```json
                [
                  {{
                    "concept": "Mutex Contention",
                    "category": "Patterns/Anti-Patterns",
                    "definition": "<u>Lock competition</u> occurs when multiple goroutines <u>simultaneously request</u> a mutex lock, creating bottlenecks",
                    "example": "var mu sync.Mutex;\ngo func() {{\n  mu.Lock()\n  defer mu.Unlock()\n  // Critical section\n}}()",
                    "anti_pattern": "Using mutex for high-frequency atomic ops:\nmu.Lock()\ncounter++\nmu.Unlock() → Use atomic.AddInt64() instead"
                  }},
                  {{
                    "concept": "Multi-stage Builds",
                    "category": "Patterns/Anti-Patterns",
                    "definition": "Reduces image size by separating <u>build environment</u> from <u>runtime environment</u>",
                    "example": "Dockerfile stages: FROM node:14 AS builder → FROM nginx:alpine COPY --from=builder ...",
                    "anti_pattern": "Including build tools in final production images"
                  }},
                  {{
                    "concept": "Volumes",
                    "category": "Architectural Components",
                    "definition": "<u>Persistent storage</u> that survives container lifecycle, unlike ephemeral <u>writable layer</u>",
                    "example": "docker run -v my_volume:/app/data",
                    "anti_pattern": "Storing database files in container writable layer"
                  }}
                ]
                Remember:
                    Reject any card missing:
                        At least one language-specific keyword (e.g., sync.Mutex).
                        A quantifiable consequence (e.g., “40% latency increase in benchmark”).
                        A concrete comparison (e.g., “Channels vs. mutexes for 1000+ goroutines”).
                    Avoid all banned phrases and remain specific in your explanations.
                    """
