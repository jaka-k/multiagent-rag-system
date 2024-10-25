from typing import Dict
import json
import asyncio

from statemachine.agents.flashcards.flashcard_agents import Flashcard

queues: Dict[str, asyncio.Queue] = {}
# QUEUE SHOULD BE PERSISTED IN DB


# TODO: IS this now obsolete with db queues?
# Function to get or create a queue for a specific name (like a workflow or client ID)
def get_queue_by_name(name: str):
    print("get_queue_by_name(name: str):", name)
    if name not in queues:
        queues[name] = asyncio.Queue()  # Create a new queue if it doesn't exist
    return queues[name]


async def flashcard_event_generator(queue: asyncio.Queue):
    print("Started event generator")
    while True:
        # Wait for a new flashcard to be added to the queue
        flashcard = await queue.get()
        print("THIS ONE IS NOT TRIGGERED", flashcard)
        yield f"event: flashcards_update\ndata: {json.dumps(flashcard)}\n\n"


async def notify_sse_client(chatId: str, flashcard: Flashcard):
    queue = get_queue_by_name(chatId)
    print("THIS ONE IS TRIGGERED", flashcard)
    print("QUEUE", queue)
    print("QUEUEs", queues)
    await queue.put(flashcard)
