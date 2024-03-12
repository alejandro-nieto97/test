from flask import Flask, Response, stream_with_context, request, Blueprint
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

bp = Blueprint('routes', __name__)
API_URL = 'http://localhost:3000/data?index={}'
CONCURRENCY_LEVEL = 10  # Adjust based on your environment capabilities

def fetch_page(url):
    response = requests.get(url)
    return response.json()

def background_task(stop_event):
    urls = [API_URL.format(page) for page in range(1, 500)]  # Example range
    with ThreadPoolExecutor(max_workers=CONCURRENCY_LEVEL) as executor:
        future_to_url = {executor.submit(fetch_page, url): url for url in urls}
        for future in as_completed(future_to_url):
            if stop_event.is_set():
                break
            data = future.result()
            yield f'data: {data}\n\n'  # Format this as needed

@bp.route('/fetch_data')
def fetch_data():
    stop_event = threading.Event()  # Event to signal when to stop the background task

    def generate(stop_event):
        try:
            for data_chunk in background_task(stop_event):
                yield data_chunk
        except GeneratorExit:  # Client has disconnected
            stop_event.set()  # Signal the background task to stop
            print("Client disconnected, stopping background task.")

    return Response(stream_with_context(generate(stop_event)), mimetype='text/event-stream')



