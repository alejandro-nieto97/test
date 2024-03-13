from dotenv import load_dotenv
import os
from app import create_app

load_dotenv()

app, socketio = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True)