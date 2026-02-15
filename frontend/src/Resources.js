import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

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
            <h5 className="alert-heading mb-2">In Crisis? Get Immediate Help</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <strong>Suicide Hotline:</strong> <a href="tel:988" className="text-danger fw-bold">988</a>
              </div>
              <div className="col-md-4">
                <strong>Crisis Text:</strong> Text <span className="fw-bold">HOME</span> to <span className="fw-bold">741741</span>
              </div>
              <div className="col-md-4">
                <strong>International:</strong> <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="text-danger fw-bold">findahelpline.com</a>
              </div>
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
          <h4 className="mb-4 fw-bold">💨 Breathing Techniques</h4>
          <div className="row mb-5">
            <div className="col-md-12 mb-4">
              <div className="card shadow border-0 bg-gradient" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
                <div className="card-body p-4 text-white">
                  <h5 className="card-title fw-bold mb-3">Box Breathing (4-4-4-4 Method)</h5>
                  <p className="mb-4">Used by Navy SEALs and athletes to reduce stress and improve focus. Follow these four simple steps:</p>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="bg-white bg-opacity-25 p-3 rounded text-center">
                        <div className="fs-1 mb-2">1️⃣</div>
                        <h6 className="fw-bold">Inhale</h6>
                        <p className="mb-0 small">Breathe in slowly for 4 seconds</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white bg-opacity-25 p-3 rounded text-center">
                        <div className="fs-1 mb-2">2️⃣</div>
                        <h6 className="fw-bold">Hold</h6>
                        <p className="mb-0 small">Hold your breath for 4 seconds</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white bg-opacity-25 p-3 rounded text-center">
                        <div className="fs-1 mb-2">3️⃣</div>
                        <h6 className="fw-bold">Exhale</h6>
                        <p className="mb-0 small">Breathe out slowly for 4 seconds</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="bg-white bg-opacity-25 p-3 rounded text-center">
                        <div className="fs-1 mb-2">4️⃣</div>
                        <h6 className="fw-bold">Hold</h6>
                        <p className="mb-0 small">Hold again for 4 seconds</p>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-light mt-4 mb-0">
                    <strong>💡 Pro Tip:</strong> Repeat this cycle 4-5 times. Practice daily for best results!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reading and Learning Tab */}
      {(activeTab === 'all' || activeTab === 'reading') && (
        <>
          {/* Mental Health Apps */}
          <h4 className="mb-4 fw-bold">📱 Recommended Mental Health Apps</h4>
          <div className="row mb-5">
            <div className="col-lg-4 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <div className="fs-1 mb-3">🧘</div>
                  <h5 className="card-title fw-bold">Headspace</h5>
                  <p className="card-text text-muted">Meditation and mindfulness made simple with guided sessions for every need.</p>
                  <div className="mb-3">
                    <span className="badge bg-success me-1">Meditation</span>
                    <span className="badge bg-info">Sleep</span>
                  </div>
                  <p className="small text-muted mb-0">⭐️ 4.8/5 • Free + Premium</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <div className="fs-1 mb-3">🌙</div>
                  <h5 className="card-title fw-bold">Calm</h5>
                  <p className="card-text text-muted">Sleep stories, meditation, and relaxation techniques for better rest.</p>
                  <div className="mb-3">
                    <span className="badge bg-primary me-1">Sleep</span>
                    <span className="badge bg-success">Relaxation</span>
                  </div>
                  <p className="small text-muted mb-0">⭐️ 4.7/5 • Free + Premium</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="card h-100 shadow border-0">
                <div className="card-body">
                  <div className="fs-1 mb-3">💬</div>
                  <h5 className="card-title fw-bold">BetterHelp</h5>
                  <p className="card-text text-muted">Connect with licensed therapists online for professional support.</p>
                  <div className="mb-3">
                    <span className="badge bg-danger me-1">Therapy</span>
                    <span className="badge bg-warning">Professional</span>
                  </div>
                  <p className="small text-muted mb-0">⭐️ 4.5/5 • Subscription</p>
                </div>
              </div>
            </div>
          </div>

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
          <h4 className="fw-bold mb-3">Need Professional Support?</h4>
          <p className="mb-4 fs-5">Talking to a licensed mental health professional can make a real difference in your journey.</p>
          <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer" className="btn btn-light btn-lg px-5">
            Find a Therapist Near You
          </a>
        </div>
      </div>
    </div>
  );
}

export default Resources;
