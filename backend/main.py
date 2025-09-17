from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from db import cursor, conn

# Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # React dev server

# Socket.IO server
socketio = SocketIO(app, cors_allowed_origins="*")

# ----- DATABASE FUNCTIONS -----
def save_message(sender, message):
    cursor.execute("INSERT INTO messages (sender, message) VALUES (?, ?)", (sender, message))
    conn.commit()

def get_messages():
    cursor.execute("SELECT sender, message FROM messages")
    return [{"sender": s, "message": m} for s, m in cursor.fetchall()]

# ----- CHATBOT LOGIC -----
def chatbot_response(message: str):
    message = message.lower()
    if "stress" in message:
        return "Try some deep breathing exercises. Would you like me to guide you?"
    elif "sleep" in message:
        return "Maintain a sleep schedule and avoid screens before bed."
    elif "hello" in message or "hi" in message:
        return "Hello! How are you feeling today?"
    else:
        return "I'm here to listen. Tell me more about how you feel."

# ----- ROUTES -----
@app.route("/")
def root():
    return jsonify({"message": "Backend running!"})

@app.route("/resources")
def resources():
    return jsonify([
        {"title": "Managing Stress", "link": "#"},
        {"title": "Healthy Sleep Tips", "link": "#"},
        {"title": "Mindfulness Exercises", "link": "#"}
    ])

@app.route("/chatbot", methods=["POST"])
def chat_with_bot():
    data = request.json
    user_msg = data.get("message", "")
    reply = chatbot_response(user_msg)
    return jsonify({"reply": reply})

# ----- SOCKET.IO EVENTS -----
@socketio.on("connect")
def handle_connect():
    print("Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")

@socketio.on("send_message")
def handle_send_message(data):
    save_message("peer", data)
    emit("receive_message", data, broadcast=True)

# ----- RUN APP -----
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
