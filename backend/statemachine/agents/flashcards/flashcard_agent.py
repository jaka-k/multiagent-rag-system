import json
from typing import List, Dict, Any, Union

from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, ValidationError

from statemachine.agents.analysis.knowledge_identification_agent import ConceptSchema
from statemachine.dtos.flashcard_dto import FlashcardDTO


class FlashcardsOutput(BaseModel):
    flashcards: List[FlashcardDTO] = Field(description="List of flashcards")


class FlashcardAgent:
    def __init__(self):
        self.model = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0
        )

        self.llm = self.model.with_structured_output(FlashcardsOutput)
        self.prompt_template = PromptTemplate(
            input_variables=["key_concepts"],
            template="""**Flashcard HTML Creation Instructions**
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
                    
                    """,
        )
        # Chain the prompt template with the llm
        self.chain = self.prompt_template | self.llm

    def invoke(self, state: dict) -> dict:
        """
        Process logic specific to the flashcard agent.
        """
        print("FlashcardAgent is processing...")
        key_concepts = state.get("identified_concepts", "")

        state["flashcards"] = self.create_flashcards(key_concepts)
        return state

    def create_flashcards(self, key_concepts: List[ConceptSchema]) -> List[FlashcardDTO]:
            validated_concepts = [ConceptSchema.model_validate(c) for c in key_concepts]
            response = self.chain.invoke({
                "key_concepts": json.dumps([c.model_dump() for c in validated_concepts])
            })


            if isinstance(response, dict):
                # Parse dictionary response into the Pydantic model
                try:
                    response = FlashcardsOutput.model_validate(response)
                except ValidationError as e:
                    raise ValueError(f"Invalid response format: {e}")

            # The response is now guaranteed to be a FlashcardsOutput model
            return response.flashcards
