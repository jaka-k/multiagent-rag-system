from langchain_core.prompts import PromptTemplate

CARDS_TO_HTML_PROMPT_V2 = """
You are an HTML renderer for Anki.

INPUT  →  `concepts` (JSON list of objects with concept, category, definition,
example?, anti_pattern?, contrast_pair?, performance?).

OUTPUT →  JSON list of **cards**:
[
  {{ "front": "<h3>…</h3>", "back": "<div>…</div>", "category": "string" }}
]

RULES
1. **Front**: `<h3>{{concept}}</h3>`
2. **Back** layout (all HTML, no Markdown):
   • definition  → `<div class="definition">…</div>`
   • example     → if exists wrap in `<pre><code>…</code></pre>`
   • anti-pattern→ if exists wrap in `<div class="anti">️☣️ …</div>`
   • contrast    → if exists wrap in `<div class="contrast">☯️ …</div>`
3. Use `<u>` around **up to 3** key terms inside the definition.
4. Return **only** the JSON array; validation schema will reject extras.

EXAMPLE

CONCEPT
```json
{{
  "concept": "Read-Write Lock",
  "category": "Concurrency API",
  "definition": "<u>Read</u> ops can share the lock; <u>write</u> blocks all",
  "example": "var mu sync.RWMutex\\nmu.RLock()",
  "anti_pattern": "Using RWMutex in single-thread code → 15 % slower",
  "contrast_pair": "sync.Mutex"
}}
```

EXPECTED OUTPUT CARD FOR EXAMPLE:
```json
[
  {{
    "front": "<h3>Read-Write Lock</h3>",
    "back": "<div class=\\"definition\\">…</div><pre><code>…</code></pre>",
    "category": "Concurrency API"
  }}
]
```

"""

FLASHCARD_TEMPLATE = """**Flashcard HTML Creation Instructions**
            Convert concepts to Anki cards using this HTML template with visual mnemonics:
            
            {key_concepts}
            
            ```html
            <div class="flashcard">
              <div class="front">
                <h3 style="color: #<<category_color>>; border-bottom: 2px solid #<<category_color>>; padding-bottom: 4px;">
                  <<concept>>
                  <span class="category-badge" style="background: #<<category_color>>1a; color: #<<category_color>>; font-size: 0.8em; padding: 2px 8px; border-radius: 12px; margin-left: 2px;">
                    <<category>>
                  </span>
                </h3>
              </div>
              
              <div class="back">
                <div class="definition" style="color: #cbd5e0; font-size: 1.1em; margin-bottom: 1.2em;">
                  <<definition>>
                </div>
                
                <<#example>>
                <div class="example" style="border-left: 4px solid #48bb78; padding: 8px 12px; margin: 10px 0; background-color: #f7fafc;">
                  <div style="color: #48bb78; font-weight: 500; margin-bottom: 6px;">🛠️ Example</div>
                  <code style="color: #2d3748; font-family: 'Fira Code', monospace; font-size: 0.9em;">
                    <<example>>
                  </code>
                </div>
                <</example>>
            
                <<#anti_pattern>>
                <div class="anti-pattern" style="border-left: 4px solid #f56565; padding: 8px 12px; margin: 10px 0;">
                  <div style="color: #f56565; font-weight: 500; margin-bottom: 6px;">⚠️ Anti-Pattern</div>
                  <div style="color: #feb2b2;">
                    <<anti_pattern>>
                  </div>
                </div>
                <</anti_pattern>>
            
                <<#contrast_pair>>
                <div class="contrast" style="background-color: #e2e8f0; padding: 10px; border-radius: 6px; margin-top: 15px;">
                  <span style="color: #4a5568; font-size: 0.9em;">🔀 Contrast with:</span>
                  <span style="color: #2d3748; font-weight: 600; margin-left: 8px;"><<contrast_pair>></span>
                </div>
                <</contrast_pair>>
              </div>
            </div>
            Color Coding Scheme (WCAG-compliant):
            
            Syntax/APIs: #3182ce (Blue)
            
            Architectural Components: #805ad5 (Purple)
            
            Patterns/Anti-Patterns: #38a169 (Green)
            
            Ecosystem Tools: #d69e2e (Gold)
            
            Security/Debugging: #e53e3e (Red)
            
            Visual Memory Features:
            
            Category Chromatic Coding: Left border + badge color matches concept category
            
            Iconic Signaling: 🛠️ for examples, ⚠️ for anti-patterns, 🔀 for contrasts
            
            Hierarchical Contrast:
            
            Front: Bold category-colored header
            
            Back: Dark text on light background (62% luminance)
            
            Focus Guides:
            
                Monospace fonts for code examples (improved legibility)
                
                Underlined terms maintained from JSON definitions
                
                Subtle background shading for interactive elements
            
            Validation Rules:
            
                All color values must use the predefined palette
                
                Anti-pattern sections must always appear after examples
                
                Contrast pair blocks only shown when field exists
            
            Font stack: System UI first, with Fira Code fallback for monospace
            
            Example Output:
            
            <div class="flashcard">
              <div class="front">
                <h3 style="color: #38a169; border-bottom: 2px solid #38a169; padding-bottom: 4px;">
                  Multi-stage Builds
                  <span class="category-badge" style="background: #38a1691a; color: #38a169; font-size: 0.8em; padding: 2px 8px; border-radius: 12px; margin-left: 2px;">
                    Patterns/Anti-Patterns
                  </span>
                </h3>
              </div>
              
              <div class="back">
                <div class="definition" style="color: #cbd5e0; font-size: 1.1em; margin-bottom: 1.2em;">
                  Reduces image size by separating <u>build environment</u> from <u>runtime environment</u>
                </div>
                
                <div class="example" style="border-left: 4px solid #48bb78; padding: 8px 12px; margin: 10px 0; background-color: #f7fafc;">
                  <div style="color: #48bb78; font-weight: 500; margin-bottom: 6px;">🛠️ Example</div>
                  <code style="color: #2d3748; font-family: 'Fira Code', monospace; font-size: 0.9em;">
                    Dockerfile stages: FROM node:14 AS builder → FROM nginx:alpine COPY --from=builder ...
                  </code>
                </div>
            
                <div class="anti-pattern" style="border-left: 4px solid #f56565; padding: 8px 12px; margin: 10px 0;">
                  <div style="color: #f56565; font-weight: 500; margin-bottom: 6px;">⚠️ Anti-Pattern</div>
                  <div style="color: #feb2b2;">
                    Including build tools in final production images
                  </div>
                </div>
              </div>
            </div>
                    
                    """