import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function PeerHub() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  // Fetch specific post with comments
  const fetchPost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}`);
      const data = await res.json();
      setSelectedPost(data.post);
    } catch (err) {
      console.error('Error fetching post:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please login to create a post');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newPostTitle, content: newPostContent })
      });

      if (res.ok) {
        setNewPostTitle("");
        setNewPostContent("");
        setShowCreatePost(false);
        fetchPosts();
      } else {
        alert('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
    }
    setLoading(false);
  };

  // Like a post
  const handleLikePost = async (postId) => {
    if (!token) {
      alert('Please login to like posts');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        if (selectedPost && selectedPost.id === postId) {
          fetchPost(postId);
        }
        fetchPosts();
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Flag a post
  const handleFlagPost = async (postId) => {
    if (!token) {
      alert('Please login to flag posts');
      return;
    }

    if (!window.confirm('Are you sure you want to flag this post for review?')) return;

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/flag`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Post flagged for review');
        fetchPosts();
        setSelectedPost(null);
      }
    } catch (err) {
      console.error('Error flagging post:', err);
    }
  };

  // Add comment to post
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (res.ok) {
        setNewComment("");
        fetchPost(selectedPost.id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Like a comment
  const handleLikeComment = async (commentId) => {
    if (!token) {
      alert('Please login to like comments');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok && selectedPost) {
        fetchPost(selectedPost.id);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">Peer Support Hub</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreatePost(!showCreatePost)}
        >
          {showCreatePost ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {/* Create Post Form */}
      {showCreatePost && (
        <div className="card mb-4 shadow">
          <div className="card-body">
            <h5>Create New Post</h5>
            <form onSubmit={handleCreatePost}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Post Title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Share your thoughts..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="row">
        {/* Posts List */}
        <div className={selectedPost ? "col-md-5" : "col-md-12"}>
          <div className="card shadow">
            <div className="card-header bg-light">
              <strong>Community Posts</strong>
            </div>
            <div className="card-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {posts.length === 0 && <p className="text-muted">No posts yet. Be the first to share!</p>}
              {posts.map(post => (
                <div key={post.id} className="card mb-3 cursor-pointer" onClick={() => fetchPost(post.id)} style={{cursor: 'pointer'}}>
                  <div className="card-body">
                    <h5 className="card-title">{post.title}</h5>
                    <p className="card-text text-truncate">{post.content}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        By {post.user?.email || 'Anonymous'} • {new Date(post.createdAt).toLocaleDateString()}
                      </small>
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }}
                        >
                          👍 {post.likes}
                        </button>
                        <span className="badge bg-secondary">{post.comments?.length || 0} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post Detail View */}
        {selectedPost && (
          <div className="col-md-7">
            <div className="card shadow">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <strong>Post Details</strong>
                <button className="btn btn-sm btn-light" onClick={() => setSelectedPost(null)}>✕</button>
              </div>
              <div className="card-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <h4>{selectedPost.title}</h4>
                <p className="text-muted">
                  By {selectedPost.user?.email || 'Anonymous'} • {new Date(selectedPost.createdAt).toLocaleDateString()}
                </p>
                <p className="mb-3">{selectedPost.content}</p>
                <div className="d-flex gap-2 mb-4">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleLikePost(selectedPost.id)}
                  >
                    👍 Like ({selectedPost.likes})
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleFlagPost(selectedPost.id)}
                  >
                    🚩 Flag
                  </button>
                </div>

                <hr />

                <h5>Comments ({selectedPost.comments?.length || 0})</h5>
                
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Comment</button>
                  </div>
                </form>

                {/* Comments List */}
                {selectedPost.comments && selectedPost.comments.map(comment => (
                  <div key={comment.id} className="card mb-2">
                    <div className="card-body py-2">
                      <p className="mb-1">{comment.content}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          By {comment.user?.email || 'Anonymous'} • {new Date(comment.createdAt).toLocaleDateString()}
                        </small>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          👍 {comment.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PeerHub;
