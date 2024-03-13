# Assuming this is in your_blueprint_file.py or similar
from flask_socketio import SocketIO
import threading
import requests
from flask import request
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from . import socketio

API_URL = 'https://test-n3zslmxd9-alenieto97.vercel.app/data?index={}&channel={}'
CONCURRENCY_LEVEL = 20
PAGES_TO_FETCH = 5000

stop_events = {}

def fetch_page(url, channel):
    try:
        formatted_url = url.format(channel)
        response = requests.get(formatted_url)
        return response.json()
    except requests.RequestException as e:
        print(f"Failed to fetch {formatted_url}: {e}")
        return {}

def background_task(socket_id, channel, stop_event):
    urls = [API_URL.format(page, channel) for page in range(1, PAGES_TO_FETCH)]
    with ThreadPoolExecutor(max_workers=CONCURRENCY_LEVEL) as executor:
        futures = [executor.submit(fetch_page, url, channel) for url in urls]
        try:
            for future in as_completed(futures):
                if stop_event.is_set():
                    print(f"Attempting to stop API calls for client: {socket_id}")
                    # Attempt to cancel all futures
                    for f in futures:
                        f.cancel()
                    break
                data = future.result() if not future.cancelled() else None
                if data:
                    socketio.emit('data_chunk', json.dumps(data), to=socket_id)
        finally:
            # Ensure all futures are cancelled if not completed
            for f in futures:
                f.cancel()

@socketio.on('start_fetch')
def handle_start_fetch(data):
    print("Client requested to start fetching data")
    channel = data.get('channel', 'general')
    socket_id = request.sid  # Get the client's socket ID to send data directly to them
    # Create a stop event for this background task and store it using the client's socket ID
    stop_event = threading.Event()
    stop_events[socket_id] = stop_event  # Map the client's socket ID to its stop event
    threading.Thread(target=background_task, args=(socket_id, channel, stop_event)).start()

@socketio.on('disconnect')
def handle_disconnect():
    socket_id = request.sid  # Get the disconnected client's socket ID
    print(f"Client disconnected: {socket_id}")
    # Retrieve and signal the stop event for the disconnected client's background task
    stop_event = stop_events.pop(socket_id, None)
    if stop_event:
        stop_event.set()  # Signal the background task to stop

@socketio.on('change_channel')
def handle_change_channel(data):
    print("Client requested to change channel")
    channel = data.get('channel', 'general')
    socket_id = request.sid  # Get the client's socket ID

    # Signal the current background task to stop
    stop_event = stop_events.get(socket_id)
    if stop_event:
        stop_event.set()

    # Create a new stop event for the new background taskf
    new_stop_event = threading.Event()
    stop_events[socket_id] = new_stop_event  # Update the mapping with the new stop event

    # Start a new background task for the new channel
    threading.Thread(target=background_task, args=(socket_id, channel, new_stop_event)).start()
