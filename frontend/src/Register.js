import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        if (onRegister) onRegister(data.user);
      } else {
        setError(data.error || 'Registration failed');
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
        <div className="col-md-6">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h2 className="text-center mb-4 fw-bold">Create Account</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                  />
                  <small className="text-muted">Public - visible to everyone</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                  <small className="text-muted">Private - only admins and counselors</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input 
                    type="email" 
                    className="form-control form-control-lg" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                  <small className="text-muted">Private - used for login</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input 
                    type="password" 
                    className="form-control form-control-lg" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Role</label>
                  <select className="form-select form-select-lg" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="counselor">Counselor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button 
                  type="submit" 
                  className="btn btn-success w-100 py-2 mb-3 fw-semibold" 
                  style={{fontSize: "1.1rem"}}
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <div className="text-center">
                  <Link to="/login" className="text-decoration-none">Already have an account? Login</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
