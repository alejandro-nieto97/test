from flask_socketio import SocketIO
import threading
import requests
from flask import request
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from . import socketio
import os
import time

# API_URL = ''http://localhost:3000/data?index={}&channel={}''
API_URL = os.environ.get('API_URL')
CONCURRENCY_LEVEL = 3
PAGES_TO_FETCH = 5000

stop_events = {}

def fetch_page(url, channel):
    try:
        formatted_url = url.format(channel)
        response = requests.get(formatted_url, timeout=10)
        print(f"Fetched {formatted_url}")
        return response.json()
    except requests.RequestException as e:
        print(f"Failed to fetch {formatted_url}: {e}")
        return {}

def background_task(socket_id, channel, stop_event):
    urls = [API_URL.format(page, channel) for page in range(1, PAGES_TO_FETCH)]
    chunk_size = 100  # Define how many URLs to process at a time for better control

    for i in range(0, len(urls), chunk_size):
        if stop_event.is_set():
            print(f"Stopping API calls for client: {socket_id}")
            break

        with ThreadPoolExecutor(max_workers=CONCURRENCY_LEVEL) as executor:
            futures = [executor.submit(fetch_page, url, channel) for url in urls[i:i+chunk_size]]
            try:
                for future in as_completed(futures):
                    if stop_event.is_set():
                        print(f"Attempting to stop API calls for client: {socket_id}")
                        break  # Break out of the loop if stop_event is set
                    data = future.result() if not future.cancelled() else None
                    if data:
                        socketio.emit('data_chunk', json.dumps(data), to=socket_id)
            finally:
                # Attempt to cancel all futures to prevent further processing
                for f in futures:
                    f.cancel()
                # Any additional cleanup can be done here
                print(f"Chunk processing completed or stopped for client: {socket_id}")


@socketio.on('start_fetch')
def handle_start_fetch(data):
    try:
        print("Client requested to start fetching data")
        channel = data.get('channel', 'general')
        socket_id = request.sid

        # Check if there's already a stop event for this socket_id (i.e., a task running)
        existing_stop_event = stop_events.get(socket_id)
        if existing_stop_event:
            print(f"Existing task running for {socket_id}. Stopping it before starting a new one.")
            existing_stop_event.set()
            time.sleep(1)  # Give a little time for the existing task to recognize the stop event and terminate

        # Now create a new stop event for the new task
        stop_event = threading.Event()
        stop_events[socket_id] = stop_event
        threading.Thread(target=background_task, args=(socket_id, channel, stop_event)).start()
    except Exception as e:
        print(f"Error handling start_fetch: {e}")


@socketio.on('disconnect')
def handle_disconnect():
    try:
        socket_id = request.sid
        print(f"Client disconnected: {socket_id}")
        stop_event = stop_events.pop(socket_id, None)
        if stop_event:
            stop_event.set()
    except Exception as e:
        print(f"Error handling disconnect: {e}")

@socketio.on('change_channel')
def handle_change_channel(data):
    try:
        print("Client requested to change channel")
        channel = data.get('channel', 'general')
        socket_id = request.sid
        stop_event = stop_events.get(socket_id)
        if stop_event:
            stop_event.set()
        new_stop_event = threading.Event()
        stop_events[socket_id] = new_stop_event
        threading.Thread(target=background_task, args=(socket_id, channel, new_stop_event)).start()
    except Exception as e:
        print(f"Error handling change_channel: {e}")
