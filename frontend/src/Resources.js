import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container py-5">
      <h2 className="text-center text-primary mb-4">Mental Health Resources</h2>

      {loading && <p className="text-center">Loading resources...</p>}

      {/* Dynamic Resources from Database */}
      {!loading && resources.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">Recommended Resources</h4>
          <div className="row">
            {resources.map(resource => (
              <div key={resource.id} className="col-md-4 mb-3">
                <div className="card h-100 shadow">
                  <div className="card-body">
                    <h5 className="card-title">{resource.title}</h5>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Visit Resource
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Embedded Resources */}
      <h4 className="mb-3">Multimedia Resources</h4>
      <div className="row">
        {/* Resource 1: Meditation Video */}
        <div className="col-md-4 mb-3">
          <div className="card h-100 shadow">
            <div className="card-body text-center">
              <h5 className="card-title">Meditation Guide</h5>
              <p className="card-text">Watch this short meditation session to calm your mind.</p>
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

        {/* Resource 2: Audio Relaxation */}
        <div className="col-md-4 mb-3">
          <div className="card h-100 shadow">
            <div className="card-body text-center">
              <h5 className="card-title">Relaxation Audio</h5>
              <p className="card-text">Listen to calming audio to release stress and anxiety.</p>
              <audio controls className="w-100">
                <source src="https://ia601303.us.archive.org/26/items/AmbientSoundbathPodcast/asb91.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>

        {/* Resource 3: Articles */}
        <div className="col-md-4 mb-3">
          <div className="card h-100 shadow">
            <div className="card-body">
              <h5 className="card-title">Helpful Articles</h5>
              <p className="card-text">Read about mental health, coping strategies, and professional insights.</p>
              <ul className="list-unstyled">
                <li>
                  <a href="https://www.medicalnewstoday.com/articles/145855" target="_blank" rel="noopener noreferrer">
                    Understanding Stress
                  </a>
                </li>
                <li>
                  <a href="https://www.mind.org.uk" target="_blank" rel="noopener noreferrer">
                    Coping with Anxiety
                  </a>
                </li>
                <li>
                  <a href="https://activeminds.org/resource/self-care/" target="_blank" rel="noopener noreferrer">
                    Self-Care 
                  </a>
                </li>
                <li>
                  <a href="https://www.helpguide.org/mental-health/wellbeing/self-care-tips-to-prioritize-your-mental-health" target="_blank" rel="noopener noreferrer">
                    Self-Care Tips to Prioritize Your Mental Health 
                  </a>
                </li>
                
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;
