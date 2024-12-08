from typing import Dict
import asyncio


queues: Dict[str, asyncio.Queue] = {}


def get_queue_by_id(id: str):
    print("get_queue_by_id(id: str):", id)
    if id not in queues:
        queues[id] = asyncio.Queue()
    return queues[id]


async def flashcard_sse_generator(queue: asyncio.Queue):
    print("Started event generator")
    while True:
        flashcard_id = await queue.get()
        print("THIS ONE IS NOT TRIGGERED", flashcard_id)
        yield f"event: flashcards_update\ndata: {flashcard_id}\n\n"


async def notify_sse_client(flashcard_queue_id: str, flashcard_id: str):
    queue = get_queue_by_id(flashcard_queue_id)
    print("THIS ONE IS TRIGGERED", flashcard_id)
    print("QUEUE", queue)
    print("QUEUEs", queues)
    await queue.put(flashcard_id)
