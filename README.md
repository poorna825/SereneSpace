# 🌿 SereneSpace

A comprehensive mental health and wellness platform designed specifically for Indian users, providing AI-powered emotional support, peer community features, and access to professional mental health resources.

## 🎯 Overview

SereneSpace is a full-stack web application that combines AI technology with mental health resources to create a supportive digital environment. The platform offers an AI chatbot with emotion detection, breathing exercises, meditation guides, peer support forums with **dual identity privacy system**, appointment scheduling, and curated mental health resources.

## ✨ Key Features

### 🔒 Privacy & Security
- **Dual Identity System**: 
  - Public username for community interactions (posts, comments)
  - Private fullName and email visible only to admins and assigned counselors
- **Role-Based Access Control**: Admin, Counselor, and User roles with appropriate permissions
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Comment Moderation**: Flag-based system with soft delete and admin controls

### 🤖 AI-Powered Chatbot
- Emotion detection using OpenAI GPT models
- Context-aware responses with natural conversation flow
- Crisis detection with immediate helpline recommendations
- Personalized conversation history tracking

### 🧘 Wellness Resources
- **Interactive Breathing Exercises**: Animated box breathing guide with visual cues
- **Guided Meditations**: Audio meditation sessions for stress relief
- **Mental Health Articles**: Curated educational content about anxiety, depression, and coping strategies
- **Mental Health Quizzes**: Self-assessment tools via Google Forms

### 👥 Peer Support Hub
- Create and share posts about mental health experiences
- Comment and react to community posts (❤️ Support, 💪 Strength, 🤗 Hug, ⭐ Inspiring)
- **Username-based interactions** (full name kept private)
- Safe and supportive community guidelines with moderation

### 📅 Professional Support
- Book appointments with mental health professionals
- Appointment status tracking (Pending, Confirmed, Completed, Cancelled)
- **Counselor-patient privacy**: Counselors see patient details only for assigned appointments
- Access to verified Indian therapy platforms:
  - **Practo**: Find therapists and psychiatrists
  - **TalktoAngel**: Online therapy and counseling
  - **Amaha**: Mental wellness services

### 🆘 Crisis Support
- Immediate access to India-specific crisis helplines:
  - **AASRA**: +91 9820466726 (24/7)
  - **Vandrevala Foundation**: 1860 2662 345 / 1800 2333 330
  - **iCall**: +91 9152987821
  - **NIMHANS**: 080-46110007
  - **Emergency**: 112

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1**: Modern UI with functional components and hooks
- **React Router 7.1.3**: Client-side routing
- **Bootstrap 5.3.8**: Responsive design and styling
- **Axios**: HTTP client for API requests

### Backend
- **Node.js & Express 4.18.2**: RESTful API server
- **Prisma 6.19.2**: ORM for database management
- **SQLite**: Local database storage
- **JWT & bcryptjs**: Authentication and password security
- **OpenAI API**: AI-powered emotion detection and empathetic responses

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/poorna825/SereneSpace.git
cd SereneSpace
```

2. **Install backend dependencies**
```bash
cd backend/express
npm install
```

3. **Set up environment variables**

Create a `.env` file in `backend/express/`:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secure-jwt-secret-key"
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-3.5-turbo"
PORT=4000
```

**Get your OpenAI API key:**
- Visit https://platform.openai.com/api-keys
- Sign up/login to your OpenAI account
- Click "Create new secret key"
- Copy and paste it into your `.env` file
- New accounts get $5 free credits (expires in 3 months)
- Pricing: GPT-3.5-turbo costs ~$0.002 per 1K tokens

4. **Initialize the database**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Install frontend dependencies**
```bash
cd ../../frontend
npm install
```

6. **Start the development servers**

Backend (from `backend/express/`):
```bash
node index.js
```

Frontend (from `frontend/`):
```bash
npm start
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:4000`.

## 📁 Project Structure

```
SereneSpace/
├── backend/
│   └── express/
│       ├── index.js              # Main Express server
│       ├── prisma/
│       │   ├── schema.prisma     # Database schema
│       │   └── dev.db            # SQLite database
│       ├── package.json
│       └── Procfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js               # Main app component with routing
│   │   ├── Login.js             # Login page
│   │   ├── Register.js          # Registration page
│   │   ├── Chatbot.js           # AI chatbot interface
│   │   ├── Resources.js         # Mental health resources
│   │   ├── PeerHub.js           # Community forum
│   │   └── EmergencySupport.js  # Crisis helplines
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Chatbot
- `POST /api/chatbot/emotion` - Emotion detection and AI response
- `GET /api/chatbot/sessions` - Get user's chat sessions
- `GET /api/chatbot/session/:sessionId/messages` - Get messages for a session

### Peer Hub
- `POST /api/posts` - Create a new post
- `GET /api/posts` - Get all posts with comments and reactions
- `POST /api/posts/:postId/comments` - Add comment to a post
- `POST /api/posts/:postId/react` - React to a post
- `POST /api/comments/:commentId/react` - React to a comment

### Appointments
- `POST /api/appointments` - Book an appointment
- `GET /api/appointments` - Get user's appointments
- `PATCH /api/appointments/:id/status` - Update appointment status

### Resources
- `GET /api/resources` - Get all mental health resources (articles, videos)

## 🎨 Features in Detail

### Interactive Breathing Guide
- 4-second inhale, hold, exhale, and hold phases
- Visual expanding/contracting circle animation
- Real-time countdown timer and phase indicators
- Color-coded step cards with benefits and tips

### Emotion-Aware Chatbot
- Detects emotions: joy, sadness, anger, fear, anxiety, stress
- Provides appropriate responses based on emotional state
- Remembers conversation context
- Suggests coping strategies and professional resources

### Community Guidelines
- Respectful and supportive environment
- Anonymous posting for privacy
- Reaction system for emotional support
- Moderated content to ensure safety

## 🌐 India-Specific Features

SereneSpace is tailored for Indian users with:
- Crisis helplines for major Indian mental health organizations
- Therapy platforms accessible in India
- Cultural sensitivity in chatbot responses
- Local support resources and emergency contacts

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Secure session management

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Poorna** - [GitHub Profile](https://github.com/poorna825)

## 🙏 Acknowledgments

- HuggingFace for AI models
- Indian mental health organizations (AASRA, Vandrevala Foundation, iCall, NIMHANS)
- Open-source community

## 📞 Support

If you're experiencing a mental health crisis, please contact:
- **AASRA**: +91 9820466726 (24/7)
- **Emergency**: 112

For technical issues, please open an issue on GitHub.

---

**Note**: SereneSpace is a support tool and does not replace professional mental health care. If you're experiencing severe mental health issues, please seek help from qualified professionals.
