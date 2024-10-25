import asyncio
from typing import List
from server.anki.sse_connection import notify_sse_client
from statemachine.agents.flashcards.flashcard_agents import Flashcard
from statemachine.agents.supervisor.knowledge_gap_agent import KnowledgeGaps
from statemachine.core.flashcard_graph import flashcards_subgraph
from tools.env import set_key_if_undefined


if __name__ == "__main__":
    set_key_if_undefined("ENVIRONMENT")
    set_key_if_undefined("OPENAI_API_KEY")
    set_key_if_undefined("LANGCHAIN_API_KEY")
    set_key_if_undefined("LANGCHAIN_ENDPOINT")
    set_key_if_undefined("LANGCHAIN_PROJECT")
    set_key_if_undefined("LANGCHAIN_TRACING_V2")
    # Supervisor identifies knowledge gaps
    supervisor_knowledge_gaps = KnowledgeGaps(
        """
        Common mistakes when using channels include: Confusion about when to use unbuffered vs. buffered channels: Unbuffered channels provide synchronization, while buffered channels do not guarantee synchronization.
        Choosing the wrong size for buffered channels: It's often best to start with a default size of 1 unless there is a specific reason to choose a different size. Using arbitrary
        "magic numbers" for channel sizes without justification can lead to confusion and potential issues in the code. Not using nil channels effectively: Nil channels can block forever when waiting for messages, and understanding their behavior can help in implementing certain patterns, such as merging channels.
        Yes, the use of channels is directly related to concurrency in Go. Channels are a mechanism for communication between goroutines, allowing them to synchronize and share data safely.
        Understanding how to use channels effectively is crucial for writing concurrent programs in Go.
        """
    )

    async def process_flashcards(chatId: str, flashcards: List[Flashcard]):
        for flashcard in flashcards:
            print(f"Front: {flashcard.front}")
            print(f"Back: {flashcard.back}\n")
            await notify_sse_client(chatId, flashcard)

    # Run the flashcards subgraph
    flashcards = flashcards_subgraph(supervisor_knowledge_gaps)
    # Use asyncio.run to execute the async function
    asyncio.run(process_flashcards("49bcf381-9573-489f-b037-ac8535a9c5cc", flashcards))
