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
    
    @app.route('/')
    def hello_world():
        return 'Hello, World!'
        
    from . import routes

    return app, socketio