import asyncio
from typing import Dict, Optional

class Session:
    def __init__(self):
        self.queue = asyncio.Queue()

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}

    def create_session(self, session_id: str) -> Session:
        session = Session()
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    def ensure_session(self, session_id: str) -> Session:
        print("ensure_session(self, session_id: str)", session_id)
        session = self.get_session(session_id)
        if not session:
            session = self.create_session(session_id)
        return session

    def dispatch_event(self, session_id: str, event: dict):
        print("dispatch_event(self, session_id: str, event: dict):", session_id)
        session = self.ensure_session(session_id)
        session.queue.put_nowait(event)