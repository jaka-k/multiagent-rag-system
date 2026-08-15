"""Mint beta invite codes for the registration PIN gate.

Usage:
    poetry run create-invite --purpose "pilot group" --count 3 --max-uses 1
"""
import argparse
import asyncio
import secrets

from sqlmodel import select

import server.models.user  # noqa: F401 — resolves the redeemed_by FK target
from server.db.database import async_session
from server.models.invite import InviteCode


async def mint(purpose: str | None, count: int, max_uses: int) -> list[str]:
    codes = []
    async with async_session() as session:
        result = await session.exec(select(InviteCode.code))
        taken = set(result.all())
        for _ in range(count):
            code = f"{secrets.randbelow(100_000_000):08d}"
            while code in taken:
                code = f"{secrets.randbelow(100_000_000):08d}"
            taken.add(code)
            session.add(InviteCode(code=code, purpose=purpose, max_uses=max_uses))
            codes.append(code)
        await session.commit()
    return codes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--purpose", default=None)
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--max-uses", type=int, default=1)
    args = parser.parse_args()

    for code in asyncio.run(mint(args.purpose, args.count, args.max_uses)):
        print(f"{code[:4]} {code[4:]}")


if __name__ == "__main__":
    main()
