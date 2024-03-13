from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# Initialize SocketIO with CORS allowed
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    cors = CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'
    
    socketio.init_app(app)
    
    # Import and register your socketio events here if they are in a different module
    from . import routes  # This ensures routes.py is imported and events registered

    return app, socketio