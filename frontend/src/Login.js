import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (onLogin) onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div 
      className="container-fluid py-5" 
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}
    >
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h2 className="text-center mb-4 fw-bold">Welcome Back</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Email</label>
                  <input 
                    type="email" 
                    className="form-control form-control-lg" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input 
                    type="password" 
                    className="form-control form-control-lg" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold" 
                  style={{fontSize: "1.1rem"}}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <div className="text-center">
                  <Link to="/register" className="text-decoration-none">Don't have an account? Register</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

