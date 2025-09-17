from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from textblob import TextBlob
from db import cursor, conn  # your db.py file

# Flask app
app = Flask(__name__)
CORS(app)  # allow frontend to connect

# Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

# ----- DATABASE -----
def save_message(sender, message):
    cursor.execute("INSERT INTO messages (sender, message) VALUES (?, ?)", (sender, message))
    conn.commit()

def get_messages():
    cursor.execute("SELECT sender, message FROM messages")
    return [{"sender": s, "message": m} for s, m in cursor.fetchall()]

# ----- CHATBOT LOGIC -----
def chatbot_response(message: str):
    blob = TextBlob(message)
    polarity = blob.sentiment.polarity
    if polarity > 0.3:
        return "That’s wonderful to hear! 😊 Tell me more about what’s making you feel good."
    elif polarity < -0.3:
        return "I’m sorry you’re feeling this way 😔. Want to talk about what’s been bothering you?"
    else:
        return "I understand. Thanks for sharing 💙. How are you coping with it?"

# ----- ROUTES -----
@app.route("/")
def root():
    return jsonify({"message": "Backend running!"})

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

# ----- RUN -----
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug =True)
