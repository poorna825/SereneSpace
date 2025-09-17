from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.get_json()
    user_message = data.get("message", "")

    # Analyze sentiment
    blob = TextBlob(user_message)
    polarity = blob.sentiment.polarity  # -1 (negative) to +1 (positive)

    if polarity > 0.3:
        bot_response = "That’s wonderful to hear! 😊 Tell me more about what’s making you feel good."
    elif polarity < -0.3:
        bot_response = "I’m sorry you’re feeling this way 😔. Want to talk about what’s been bothering you?"
    else:
        bot_response = "I understand. Thanks for sharing 💙. How are you coping with it?"

    return jsonify({"reply": bot_response})

if __name__ == "__main__":
    app.run(port=5000)

