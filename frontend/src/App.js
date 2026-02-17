import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Chatbot from "./Chatbot";  
import Resources from "./Resources";
import PeerHub from "./PeerHub";
import EmergencySupport from './EmergencySupport';
import Login from './Login';
import Register from './Register';
import Appointments from './Appointments';
import AdminDashboard from './AdminDashboard';
import { FaUserFriends, FaBookOpen, FaRobot, FaMusic, FaPause, FaPlay } from "react-icons/fa";

// Scroll to top on route change
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}
const features = [
  {
    icon: <FaUserFriends size={48} className="text-primary mb-3"/>,
    title: "Peer Hub",
    description: "Connect with a supportive community. Share experiences, exchange coping strategies, and find comfort in knowing you're not alone.",
    image: "https://cdn.pixabay.com/photo/2017/06/27/11/48/team-spirit-2447163_1280.jpg",
    link: "/peerhub"
  },
  {
    icon: <FaBookOpen size={48} className="text-success mb-3"/>,
    title: "Resources",
    description: "Access evidence-based articles, coping techniques, and mental health education to empower your wellness journey.",
    image: "https://cdn.pixabay.com/photo/2016/02/16/21/07/christmas-background-1204029_1280.jpg",
    link: "/resources"
  },
  {
    icon: <FaRobot size={48} className="text-info mb-3"/>,
    title: "AI Chatbot",
    description: "Chat with our emotion-aware AI assistant 24/7. Get instant support, guidance, and a listening ear whenever you need it.",
    image: "https://cdn.pixabay.com/photo/2023/02/04/17/28/chat-7767694_1280.jpg",
    link: "/chat"
  }
];

function Home() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  useEffect(() => {
    // Attempt to autoplay when component mounts
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          // First try: play with sound
          await audioRef.current.play();
          setIsPlaying(true);
          setIsMuted(false);
          setAutoplayFailed(false);
        } catch (error) {
          // If autoplay with sound fails, try muted autoplay
          console.log('Autoplay with sound prevented, trying muted:', error);
          try {
            audioRef.current.muted = true;
            await audioRef.current.play();
            setIsPlaying(true);
            setIsMuted(true);
            setAutoplayFailed(false);
          } catch (mutedError) {
            // Even muted autoplay failed
            console.log('Muted autoplay also prevented:', mutedError);
            setAutoplayFailed(true);
            setIsPlaying(false);
            setIsMuted(false);
          }
        }
      }
    };

    playAudio();

    // Add click listener to unmute on first user interaction
    const handleFirstInteraction = () => {
      if (audioRef.current && audioRef.current.muted && isPlaying) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });

    // Cleanup: stop audio when navigating away from Home
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Unmute if it was muted
        if (audioRef.current.muted) {
          audioRef.current.muted = false;
          setIsMuted(false);
        }
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayFailed(false);
          })
          .catch(error => {
            console.error('Playback failed:', error);
            setAutoplayFailed(true);
          });
      }
    }
  };

  return (
    <>
      {/* Background Audio */}
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
        style={{display: 'none'}}
      >
        <source src="/soothing.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Audio Control Button */}
      <div 
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000
        }}
      >
        <button
          onClick={toggleAudio}
          className="btn btn-lg shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '50px',
            border: 'none',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            fontSize: '16px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          {isPlaying ? (
            <>
              <FaPause size={18} />
              <span>{isMuted ? 'Unmute Music' : 'Pause Music'}</span>
            </>
          ) : (
            <>
              <FaPlay size={18} />
              <span>Play Music</span>
            </>
          )}
        </button>
        
        {isMuted && isPlaying && (
          <div 
            className="alert alert-warning mt-2 shadow-sm"
            style={{
              fontSize: '12px',
              padding: '8px 12px',
              marginBottom: 0,
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}
          >
            <FaMusic className="me-1" />
            Music muted - click to unmute
          </div>
        )}
        
        {autoplayFailed && !isPlaying && (
          <div 
            className="alert alert-info mt-2 shadow-sm"
            style={{
              fontSize: '12px',
              padding: '8px 12px',
              marginBottom: 0,
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}
          >
            <FaMusic className="me-1" />
            Click to play calming music
          </div>
        )}
      </div>

      {/* Hero Section */}
      <header className="py-5 text-center text-white" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "400px", display: "flex", alignItems: "center"}}>
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">Your Mental Health Matters</h1>
          <p className="lead mb-4 fs-4">A safe space for support, resources, and connection. You don't have to face mental health challenges alone.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/chat" className="btn btn-lg btn-light shadow-lg px-4">
              <FaRobot className="me-2" />Start Chatting
            </Link>
            <Link to="/resources" className="btn btn-lg btn-outline-light shadow-lg px-4">
              <FaBookOpen className="me-2" />Explore Resources
            </Link>
          </div>
        </div>
      </header>

      {/* Emergency Support */}
      <section className="container my-5">
        <EmergencySupport />
      </section>

      {/* Mental Health Quiz Section */}
      <section className="container my-5 py-4">
        <div className="card border-0 shadow-lg" style={{background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"}}>
          <div className="card-body text-center text-white py-5">
            <h2 className="fw-bold mb-3">Take a Mental Health Self-Check</h2>
            <p className="lead mb-4 mx-auto" style={{maxWidth: "700px"}}>
              Understanding your mental health is an important step in your wellness journey. 
              These brief, confidential quizzes can help you reflect on your current well-being. 
              Remember, these are not medical diagnoses—just helpful tools for self-awareness.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <a 
                href="https://share.google/d2UzidJEuTX1TqMWJ" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-lg btn-light shadow px-5 py-3 fw-bold"
                style={{minWidth: "200px"}}
              >
                Mental Health Check
              </a>
              <a 
                href="https://share.google/aYQ9G4JBkQdc5Zipd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-lg btn-light shadow px-5 py-3 fw-bold"
                style={{minWidth: "200px"}}
              >
                Wellness Assessment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container my-5 py-4">
        <h2 className="text-center mb-5 fw-bold">Explore Our Features</h2>
        <div className="row g-4">
          {features.map(({icon, title, description, image, link}, i) => (
            <div className="col-md-4" key={i}>
              <Link to={link} className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 hover-lift" style={{transition: "transform 0.3s", cursor: "pointer"}}>
                  <img src={image} alt={title} className="card-img-top rounded-top" style={{height: '200px', objectFit: 'cover'}}/>
                  <div className="card-body text-center">
                    {icon}
                    <h3 className="card-title fw-bold text-dark">{title}</h3>
                    <p className="card-text text-muted">{description}</p>
                    <span className="btn btn-outline-primary btn-sm mt-2">Learn More →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white py-5 my-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Ready to Start Your Wellness Journey?</h2>
          <p className="lead mb-4">Join SereneSpace today and take the first step towards better mental health.</p>
          <Link to="/register" className="btn btn-lg btn-light shadow px-5">Get Started Free</Link>
        </div>
      </section>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:4000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    window.location.href = '/';
  };

  const handleRegister = (userData) => {
    alert('Registration successful! Please login.');
    window.location.href = '/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
          <div className="container">
            <Link className="navbar-brand fs-3 fw-bold" to="/">SereneSpace</Link>
            <button 
              className="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav" 
              aria-controls="navbarNav" 
              aria-expanded="false" 
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto fs-5">
                <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/resources">Resources</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/peerhub">Peer Hub</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/chat">Chatbot</Link></li>
                {user && (
                  <li className="nav-item"><Link className="nav-link" to="/appointments">Appointments</Link></li>
                )}
                {user && user.role === 'admin' && (
                  <li className="nav-item"><Link className="nav-link text-warning" to="/admin">Admin Dashboard</Link></li>
                )}
                {!user && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
                  </>
                )}
                {user && (
                  <>
                    <li className="nav-item">
                      <span className="nav-link text-info">{user.username || user.email} ({user.role})</span>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>

        {/* Scroll to top on navigation */}
        <ScrollToTop />

        {/* Routes */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/peerhub" element={<PeerHub />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-3 mt-5 shadow">
          <p className="mb-0 fs-6">© 2026 SereneSpace</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
