# SereneSpace Project Overview

## Purpose
SereneSpace is a mental health companion web application. It provides users with psychoeducational resources, peer support, and an AI-powered chatbot for mental health assistance. The platform aims to foster community, offer emergency support, and connect users with counselors.

## Main Backend Files
- backend/express/index.js: Express server, user/auth endpoints, JWT authentication, Prisma integration.
- backend/express/prisma/schema.prisma: Database schema for SQLite.
- backend/express/prisma/dev.db: SQLite database.

## Main Frontend Files
- frontend/src/App.js: Main React app, routing, navigation.
- frontend/src/Login.js: User login form, connects to backend.
- frontend/src/Register.js: User registration form, connects to backend.
- frontend/src/PeerHub.js: Peer support chat, now fetches users from backend.
- frontend/src/Chatbot.js: AI chatbot interface.
- frontend/src/Resources.js: Mental health resources.
- frontend/src/EmergencySupport.js: Emergency support button.

## Key Features
- User registration and login with JWT authentication.
- PeerHub chat with real user data from backend.
- AI chatbot for mental health support.
- Emergency support notification.
- Psychoeducational resources (video/audio).

## Next Steps
- Implement backend endpoints for messages and real-time chat.
- Add authentication state and route protection in frontend.
- Refine error handling and UX.
- Push changes to remote repository.
