#!/usr/bin/env python3
import asyncio
from chat.chat_query import answer_query_stream

async def test_streaming():
    print("Testing streaming functionality...")
    async for chunk in answer_query_stream('What are the symptoms of diabetes?', 'patient'):
        print(chunk, end='', flush=True)
    print("\n--- Streaming test completed ---")

if __name__ == "__main__":
    asyncio.run(test_streaming())
