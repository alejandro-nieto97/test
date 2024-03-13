from dotenv import load_dotenv
import os
from app import create_app

# Load environment variables from .env file
load_dotenv()

app, socketio = create_app()  # Note that we're now receiving two values

if __name__ == '__main__':
    # Use socketio.run to start the server instead of app.run
    socketio.run(app, debug=True)