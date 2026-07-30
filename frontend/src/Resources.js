import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Breathing Animation Component
function BreathingGuide() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('ready'); // ready, inhale, hold1, exhale, hold2
  const [count, setCount] = useState(4);

  useEffect(() => {
    if (!isActive) return;

    const phases = [
      { name: 'inhale', duration: 4000, text: 'Breathe In' },
      { name: 'hold1', duration: 4000, text: 'Hold' },
      { name: 'exhale', duration: 4000, text: 'Breathe Out' },
      { name: 'hold2', duration: 4000, text: 'Hold' }
    ];

    let currentPhaseIndex = 0;
    let countInterval;
    let phaseTimeout;

    const runPhase = () => {
      const currentPhase = phases[currentPhaseIndex];
      setPhase(currentPhase.name);
      setCount(4);

      // Countdown
      countInterval = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            clearInterval(countInterval);
            return 4;
          }
          return prev - 1;
        });
      }, 1000);

      // Move to next phase
      phaseTimeout = setTimeout(() => {
        clearInterval(countInterval);
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        runPhase();
      }, currentPhase.duration);
    };

    runPhase();

    return () => {
      clearInterval(countInterval);
      clearTimeout(phaseTimeout);
    };
  }, [isActive]);

  const getPhaseText = () => {
    switch(phase) {
      case 'inhale': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold2': return 'Hold';
      default: return 'Click Start';
    }
  };

  const getCircleSize = () => {
    if (phase === 'inhale') return '250px';
    if (phase === 'exhale') return '100px';
    return '175px';
  };

  return (
    <div className="text-center py-4">
      <div 
        className="breathing-circle mx-auto mb-4 d-flex align-items-center justify-content-center flex-column shadow-lg"
        style={{
          width: getCircleSize(),
          height: getCircleSize(),
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.9)',
          transition: 'all 4s ease-in-out',
          border: '5px solid white',
          boxShadow: '0 0 40px rgba(255, 255, 255, 0.5)'
        }}
      >
        <div className="fs-1 fw-bold text-primary mb-2" style={{fontSize: '3rem'}}>{isActive ? count : '4'}</div>
        <div className="text-primary fw-bold fs-5">{getPhaseText()}</div>
      </div>
      <button 
        className={`btn btn-lg ${isActive ? 'btn-light' : 'btn-outline-light'} px-5 shadow`}
        onClick={() => setIsActive(!isActive)}
        style={{fontSize: '1.2rem'}}
      >
        {isActive ? '⏸ Stop' : '▶ Start Breathing Exercise'}
      </button>
      {isActive && (
        <div className="mt-3 text-white">
          <small>Follow the circle: it grows as you inhale, stays steady as you hold, and shrinks as you exhale</small>
        </div>
      )}
    </div>
  );
}

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Fetch resources from backend
    fetch('http://localhost:4000/api/resources')
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching resources:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-5" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-primary mb-3">Mental Health Resources</h1>
        <p className="lead text-muted">Evidence-based tools, guides, and support for your wellness journey</p>
      </div>

      {/* Emergency Support Banner */}
      <div className="alert alert-danger shadow mb-5" role="alert">
        <div className="d-flex align-items-center">
          <span className="fs-3 me-3">🚨</span>
          <div className="flex-grow-1">
            <h5 className="alert-heading mb-3">In Crisis? Get Immediate Help (India 🇮🇳)</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <strong>AASRA (24x7):</strong><br/>
                <a href="tel:+919820466726" className="text-danger fw-bold">+91 9820466726</a>
              </div>
              <div className="col-md-4">
                <strong>Vandrevala Foundation:</strong><br/>
                <a href="tel:18602662345" className="text-danger fw-bold">1860 2662 345</a> / <span className="fw-bold">1800 2333 330</span>
              </div>
              <div className="col-md-4">
                <strong>iCall (Mon-Sat):</strong><br/>
                <a href="tel:+919152987821" className="text-danger fw-bold">+91 9152987821</a>
              </div>
            </div>
            <div className="text-center mt-3">
              <small><strong>NIMHANS Crisis:</strong> <a href="tel:08046110007" className="text-danger fw-bold">080-46110007</a> | <strong>Emergency:</strong> <span className="fw-bold">112</span></small>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <ul className="nav nav-pills nav-fill mb-4 shadow-sm bg-white rounded p-2">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Resources
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'meditation' ? 'active' : ''}`}
            onClick={() => setActiveTab('meditation')}
          >
            🧘 Meditation
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'breathing' ? 'active' : ''}`}
            onClick={() => setActiveTab('breathing')}
          >
            💨 Breathing
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reading' ? 'active' : ''}`}
            onClick={() => setActiveTab('reading')}
          >
            📖 Reading
          </button>
        </li>
      </ul>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* All Resources Tab */}
      {(activeTab === 'all' || activeTab === 'meditation') && (
        <>
          <h4 className="mb-4 fw-bold">🎧 Guided Meditation & Relaxation</h4>
          <div className="row mb-5">
            {/* Meditation Video */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold">🧘‍♀️ 5-Minute Meditation</h5>
                  <p className="card-text text-muted">Quick guided meditation to calm your mind and reduce stress</p>
                  <div className="ratio ratio-16x9 mb-2">
                    <iframe
                      src="https://www.youtube.com/embed/inpok4MKVLM"
                      title="Meditation Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>

            {/* Relaxation Audio */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold">🎵 Relaxation Soundscape</h5>
                  <p className="card-text text-muted">Calming ambient sounds for stress relief and focus</p>
                  <audio controls className="w-100 mb-3">
                    <source src="https://ia601303.us.archive.org/26/items/AmbientSoundbathPodcast/asb91.mp3" type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <small className="text-muted">💡 Tip: Use headphones for the best experience</small>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Breathing Exercises Tab */}
      {(activeTab === 'all' || activeTab === 'breathing') && (
        <>
          <h4 className="mb-4 fw-bold">💨 Breathing Techniques for Stress Relief</h4>
          
          {/* Interactive Breathing Guide Card */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-lg border-0" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "20px"}}>
                <div className="card-body p-5 text-white">
                  <div className="text-center mb-4">
                    <h3 className="fw-bold mb-2">🧘‍♀️ Box Breathing Exercise</h3>
                    <p className="lead mb-0">Used by Navy SEALs, athletes, and mindfulness practitioners</p>
                    <small className="d-block mt-2 opacity-75">A powerful technique to reduce stress and improve focus in just minutes</small>
                  </div>
                  
                  {/* Interactive Breathing Guide */}
                  <div className="my-5 py-4" style={{background: "rgba(255, 255, 255, 0.1)", borderRadius: "15px"}}>
                    <BreathingGuide />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works - Step by Step */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow border-0" style={{borderRadius: "15px"}}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4 text-center text-primary">
                    <span className="me-2">📋</span>How It Works - Follow These Steps
                  </h5>
                  <div className="row g-4">
                    <div className="col-md-3 col-sm-6">
                      <div className="text-center p-3 h-100" style={{background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)", borderRadius: "12px"}}>
                        <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{width: '70px', height: '70px'}}>
                          <span className="fs-1 fw-bold text-white">1</span>
                        </div>
                        <h6 className="fw-bold text-primary mb-2">Inhale</h6>
                        <p className="mb-0 small text-dark">Breathe in slowly through your nose for 4 seconds</p>
                        <div className="mt-2 text-primary">↑ 4s</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-center p-3 h-100" style={{background: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)", borderRadius: "12px"}}>
                        <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{width: '70px', height: '70px'}}>
                          <span className="fs-1 fw-bold text-white">2</span>
                        </div>
                        <h6 className="fw-bold text-warning mb-2">Hold</h6>
                        <p className="mb-0 small text-dark">Hold your breath gently for 4 seconds</p>
                        <div className="mt-2 text-warning">⏸ 4s</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-center p-3 h-100" style={{background: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)", borderRadius: "12px"}}>
                        <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{width: '70px', height: '70px'}}>
                          <span className="fs-1 fw-bold text-white">3</span>
                        </div>
                        <h6 className="fw-bold text-success mb-2">Exhale</h6>
                        <p className="mb-0 small text-dark">Breathe out slowly through your mouth for 4 seconds</p>
                        <div className="mt-2 text-success">↓ 4s</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-center p-3 h-100" style={{background: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)", borderRadius: "12px"}}>
                        <div className="bg-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{width: '70px', height: '70px'}}>
                          <span className="fs-1 fw-bold text-white">4</span>
                        </div>
                        <h6 className="fw-bold text-info mb-2">Hold Again</h6>
                        <p className="mb-0 small text-dark">Hold your breath again for 4 seconds</p>
                        <div className="mt-2 text-info">⏸ 4s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits and Tips */}
          <div className="row mb-5">
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm border-0 h-100" style={{borderRadius: "12px", background: "#f8f9fa"}}>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3 text-success">
                    <span className="me-2">✨</span>Benefits
                  </h6>
                  <ul className="mb-0" style={{lineHeight: "2"}}>
                    <li>Reduces stress and anxiety instantly</li>
                    <li>Improves focus and mental clarity</li>
                    <li>Regulates nervous system</li>
                    <li>Lowers blood pressure naturally</li>
                    <li>Can be done anywhere, anytime</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm border-0 h-100" style={{borderRadius: "12px", background: "#f8f9fa"}}>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3 text-info">
                    <span className="me-2">💡</span>Pro Tips
                  </h6>
                  <ul className="mb-0" style={{lineHeight: "2"}}>
                    <li>Practice in a quiet, comfortable space</li>
                    <li>Sit with your back straight</li>
                    <li>Repeat the cycle 4-5 times</li>
                    <li>Practice daily for best results</li>
                    <li>Use during stressful moments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reading and Learning Tab */}
      {(activeTab === 'all' || activeTab === 'reading') && (
        <>
          {/* Articles and Guides */}
          <h4 className="mb-4 fw-bold">📖 Essential Reading & Guides</h4>
          <div className="row mb-5">
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold text-primary">Understanding Mental Health</h5>
                  <p className="text-muted mb-3">Learn the fundamentals of mental health and common conditions</p>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <a href="https://www.medicalnewstoday.com/articles/145855" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → Understanding Stress and Anxiety
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="https://www.mind.org.uk" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → Coping with Anxiety Disorders
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="https://www.mentalhealth.gov/basics/what-is-mental-health" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → What is Mental Health?
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold text-success">Self-Care & Wellness</h5>
                  <p className="text-muted mb-3">Practical strategies for maintaining mental wellness</p>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <a href="https://activeminds.org/resource/self-care/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → Self-Care Fundamentals
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="https://www.helpguide.org/mental-health/wellbeing/self-care-tips-to-prioritize-your-mental-health" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → Self-Care Tips for Mental Health
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="https://www.psychologytoday.com/us/basics/self-care" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        → Psychology of Self-Care
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Resources from Database (show in all tabs) */}
      {!loading && resources.length > 0 && activeTab === 'all' && (
        <div className="mb-5">
          <h4 className="mb-4 fw-bold">📚 Community Recommended Resources</h4>
          <div className="row">
            {resources.map(resource => (
              <div key={resource.id} className="col-lg-4 mb-4">
                <div className="card h-100 shadow border-0">
                  <div className="card-body">
                    <h5 className="card-title text-primary fw-bold">{resource.title}</h5>
                    <p className="card-text text-muted mb-3">{resource.description || 'Helpful mental health resource'}</p>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary"
                    >
                      Visit Resource →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Help CTA */}
      <div className="card shadow border-0 mb-4" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
        <div className="card-body text-center p-5 text-white">
          <div className="fs-1 mb-3">💙</div>
          <h4 className="fw-bold mb-3">Need Professional Support in India?</h4>
          <p className="mb-4 fs-5">Talking to a licensed mental health professional can make a real difference in your journey.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <a href="https://www.practo.com/" target="_blank" rel="noopener noreferrer" className="btn btn-light btn-lg px-4">
              <strong>Practo</strong> - Find Therapists
            </a>
            <a href="https://www.talktoangel.com/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-lg px-4">
              <strong>TalktoAngel</strong> - Online Therapy
            </a>
            <a href="https://www.amahahealth.com/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-lg px-4">
              <strong>Amaha</strong> - Mental Wellness
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;
