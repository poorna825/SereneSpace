import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaComments, 
  FaCalendarCheck, 
  FaExclamationTriangle,
  FaChartLine,
  FaUserShield,
  FaUserMd,
  FaUser,
  FaFlag
} from 'react-icons/fa';

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [flaggedContent, setFlaggedContent] = useState({ posts: [], comments: [] });
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch analytics data
    fetch('http://localhost:4000/api/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) {
          alert('Access denied. Admin privileges required.');
          navigate('/');
          throw new Error('Not authorized');
        }
        return res.json();
      })
      .then(data => {
        setAnalytics(data.analytics);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics:', err);
        setError(err.message);
        setLoading(false);
      });

    // Fetch flagged content
    fetch('http://localhost:4000/api/posts/flagged', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setFlaggedContent(prev => ({ ...prev, posts: data.posts }));
        }
      })
      .catch(err => console.error('Error fetching flagged posts:', err));

    fetch('http://localhost:4000/api/comments/flagged', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.comments) {
          setFlaggedContent(prev => ({ ...prev, comments: data.comments }));
        }
      })
      .catch(err => console.error('Error fetching flagged comments:', err));

    // Fetch all users for user management
    fetch('http://localhost:4000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setAllUsers(data.users);
        }
      })
      .catch(err => console.error('Error fetching users:', err));
  }, [navigate]);

  const handleUnflagContent = async (type, id) => {
    const token = localStorage.getItem('token');
    const endpoint = type === 'post' ? 'posts' : 'comments';
    
    try {
      const res = await fetch(`http://localhost:4000/api/${endpoint}/${id}/unflag`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        // Remove from flagged content list
        setFlaggedContent(prev => ({
          ...prev,
          [type === 'post' ? 'posts' : 'comments']: 
            prev[type === 'post' ? 'posts' : 'comments'].filter(item => item.id !== id)
        }));
        alert(`${type} unflagged successfully`);
      }
    } catch (err) {
      console.error(`Error unflagging ${type}:`, err);
      alert(`Failed to unflag ${type}`);
    }
  };

  const handleDeleteContent = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    const token = localStorage.getItem('token');
    const endpoint = type === 'post' ? 'posts' : 'comments';
    
    try {
      const res = await fetch(`http://localhost:4000/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setFlaggedContent(prev => ({
          ...prev,
          [type === 'post' ? 'posts' : 'comments']: 
            prev[type === 'post' ? 'posts' : 'comments'].filter(item => item.id !== id)
        }));
        alert(`${type} deleted successfully`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(`Failed to delete ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 mb-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">
            <FaUserShield className="me-2" />
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine className="me-1" /> Overview
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'flagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('flagged')}
          >
            <FaFlag className="me-1" /> Flagged Content 
            {(flaggedContent.posts.length + flaggedContent.comments.length) > 0 && (
              <span className="badge bg-danger ms-2">
                {flaggedContent.posts.length + flaggedContent.comments.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers className="me-1" /> User Management
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <>
          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            {/* Users Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">Total Users</h6>
                      <h2 className="mb-0">{analytics.users.total}</h2>
                      <small className="text-success">
                        +{analytics.users.recentSignups} this week
                      </small>
                    </div>
                    <FaUsers size={40} className="text-primary" />
                  </div>
                  <hr />
                  <div className="small">
                    <div className="d-flex justify-content-between">
                      <span><FaUserShield className="text-danger" /> Admin:</span>
                      <strong>{analytics.users.byRole.admin || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><FaUserMd className="text-info" /> Counselor:</span>
                      <strong>{analytics.users.byRole.counselor || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><FaUser className="text-secondary" /> User:</span>
                      <strong>{analytics.users.byRole.user || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sessions Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">Chat Sessions</h6>
                      <h2 className="mb-0">{analytics.chat.totalSessions}</h2>
                      <small className="text-success">
                        +{analytics.chat.recentSessions} this week
                      </small>
                    </div>
                    <FaComments size={40} className="text-info" />
                  </div>
                  <hr />
                  <div className="small">
                    <div className="d-flex justify-content-between">
                      <span>Total Messages:</span>
                      <strong>{analytics.chat.totalMessages}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Anonymous:</span>
                      <strong>{analytics.chat.anonymousSessions}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">Appointments</h6>
                      <h2 className="mb-0">{analytics.appointments.total}</h2>
                      <small className="text-success">
                        +{analytics.appointments.recentAppointments} this week
                      </small>
                    </div>
                    <FaCalendarCheck size={40} className="text-success" />
                  </div>
                  <hr />
                  <div className="small">
                    <div className="d-flex justify-content-between">
                      <span>Pending:</span>
                      <strong className="text-warning">{analytics.appointments.byStatus.pending || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Confirmed:</span>
                      <strong className="text-info">{analytics.appointments.byStatus.confirmed || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Completed:</span>
                      <strong className="text-success">{analytics.appointments.byStatus.completed || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peer Support Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">Peer Support</h6>
                      <h2 className="mb-0">{analytics.peerSupport.totalPosts}</h2>
                      <small className="text-success">
                        +{analytics.peerSupport.recentPosts} posts this week
                      </small>
                    </div>
                    <FaExclamationTriangle size={40} className="text-warning" />
                  </div>
                  <hr />
                  <div className="small">
                    <div className="d-flex justify-content-between">
                      <span>Total Comments:</span>
                      <strong>{analytics.peerSupport.totalComments}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-danger">Flagged Posts:</span>
                      <strong className="text-danger">{analytics.peerSupport.flaggedPosts}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-danger">Flagged Comments:</span>
                      <strong className="text-danger">{analytics.peerSupport.flaggedComments}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <FaChartLine className="me-2" />
                    System Activity
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>Total Analytics Logs</td>
                        <td className="text-end"><strong>{analytics.logs.totalAnalyticsLogs}</strong></td>
                      </tr>
                      <tr>
                        <td>Post Likes (Total)</td>
                        <td className="text-end"><strong>{analytics.peerSupport.totalPostLikes}</strong></td>
                      </tr>
                      <tr>
                        <td>Comment Likes (Total)</td>
                        <td className="text-end"><strong>{analytics.peerSupport.totalCommentLikes}</strong></td>
                      </tr>
                      <tr>
                        <td>Anonymous Chat Sessions</td>
                        <td className="text-end"><strong>{analytics.chat.anonymousSessions}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <FaCalendarCheck className="me-2" />
                    Recent Activity (Last 7 Days)
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>New User Signups</td>
                        <td className="text-end"><strong className="text-primary">{analytics.users.recentSignups}</strong></td>
                      </tr>
                      <tr>
                        <td>New Chat Sessions</td>
                        <td className="text-end"><strong className="text-info">{analytics.chat.recentSessions}</strong></td>
                      </tr>
                      <tr>
                        <td>New Appointments</td>
                        <td className="text-end"><strong className="text-success">{analytics.appointments.recentAppointments}</strong></td>
                      </tr>
                      <tr>
                        <td>New Posts</td>
                        <td className="text-end"><strong className="text-warning">{analytics.peerSupport.recentPosts}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Flagged Content Tab */}
      {activeTab === 'flagged' && (
        <div>
          <h3 className="mb-4">
            <FaFlag className="text-danger me-2" />
            Content Moderation
          </h3>

          {/* Flagged Posts */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">Flagged Posts ({flaggedContent.posts.length})</h5>
            </div>
            <div className="card-body">
              {flaggedContent.posts.length === 0 ? (
                <p className="text-muted mb-0">No flagged posts</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedContent.posts.map(post => (
                        <tr key={post.id}>
                          <td>{post.id}</td>
                          <td className="text-truncate" style={{maxWidth: '300px'}}>
                            {post.content}
                          </td>
                          <td>{post.author?.username || 'Unknown'}</td>
                          <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleUnflagContent('post', post.id)}
                            >
                              Unflag
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteContent('post', post.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Flagged Comments */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Flagged Comments ({flaggedContent.comments.length})</h5>
            </div>
            <div className="card-body">
              {flaggedContent.comments.length === 0 ? (
                <p className="text-muted mb-0">No flagged comments</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedContent.comments.map(comment => (
                        <tr key={comment.id}>
                          <td>{comment.id}</td>
                          <td className="text-truncate" style={{maxWidth: '300px'}}>
                            {comment.content}
                          </td>
                          <td>{comment.author?.username || 'Unknown'}</td>
                          <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleUnflagContent('comment', comment.id)}
                            >
                              Unflag
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteContent('comment', comment.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div>
          <h3 className="mb-4">
            <FaUsers className="me-2" />
            User Management
          </h3>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {allUsers.length === 0 ? (
                <p className="text-muted">No users found</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            {user.role === 'admin' && <FaUserShield className="text-danger me-1" />}
                            {user.role === 'counselor' && <FaUserMd className="text-info me-1" />}
                            {user.role === 'user' && <FaUser className="text-secondary me-1" />}
                            {user.username || 'N/A'}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.fullName || 'N/A'}</td>
                          <td>
                            <span className={`badge ${
                              user.role === 'admin' ? 'bg-danger' : 
                              user.role === 'counselor' ? 'bg-info' : 
                              'bg-secondary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
