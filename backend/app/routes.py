import os
from flask import Blueprint, Response, jsonify
import asyncio
import aiohttp
from flask import stream_with_context

API_URL = os.environ.get('API_URL', 'http://localhost:3000/data?index={}')
CONCURRENCY_LEVEL = 100  # Adjust concurrency level as needed

bp = Blueprint('routes', __name__)

async def fetch_page(session, url):
    async with session.get(url) as response:
        return await response.json()

async def generate_responses():
    async with aiohttp.ClientSession() as session:
        for page in range(1, 5000):
            response = await fetch_page(session, API_URL.format(page))
            yield jsonify(response) + b'\n'  # Yield each response as JSON bytes

@bp.route('/fetch_data', methods=['GET'])
def fetch_data():
    async def async_stream():
        async for chunk in generate_responses():
            yield chunk

    # Stream the responses manually using WSGI
    return Response(stream_with_context(async_stream()), content_type='application/json')


