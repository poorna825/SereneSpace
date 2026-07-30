import React, { useState, useEffect } from 'react';

export default function Appointments() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reschedule state
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const token = localStorage.getItem('token');

  // Fetch user profile and appointments on load
  useEffect(() => {
    if (!token) {
      setError('Please login to view appointments');
      setLoading(false);
      return;
    }

    fetchUserProfile();
    fetchAppointments();
    fetchCounselors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Network error while fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Filter for counselors only
        const counselorList = data.users.filter(u => u.role === 'counselor');
        setCounselors(counselorList);
      }
    } catch (err) {
      console.error('Error fetching counselors:', err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedCounselor || !scheduledDate || !scheduledTime) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const res = await fetch('http://localhost:4000/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          counselorId: Number(selectedCounselor),
          scheduledAt
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccessMessage('Appointment booked successfully!');
        setShowBookingForm(false);
        setSelectedCounselor('');
        setScheduledDate('');
        setScheduledTime('');
        setNotes('');
        fetchAppointments(); // Refresh list
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError('Network error while booking appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccessMessage('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError('Network error while cancelling appointment');
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSuccessMessage(`Appointment ${newStatus} successfully`);
        fetchAppointments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error while updating status');
    }
  };

  const handleReschedule = async (appointmentId) => {
    if (!newDate || !newTime) {
      setError('Please select new date and time');
      return;
    }

    try {
      const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
      
      const res = await fetch(`http://localhost:4000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scheduledAt })
      });

      if (res.ok) {
        setSuccessMessage('Appointment rescheduled successfully');
        setRescheduling(null);
        setNewDate('');
        setNewTime('');
        fetchAppointments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reschedule');
      }
    } catch (err) {
      setError('Network error while rescheduling');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-warning text-dark';
      case 'confirmed': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!token) {
    return (
      <div className="container py-5 text-center">
        <h2>Please login to view appointments</h2>
        <a href="/login" className="btn btn-primary mt-3">Go to Login</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col">
          <h1 className="fw-bold">
            {user?.role === 'counselor' 
              ? 'My Patient Appointments' 
              : user?.role === 'admin' 
              ? 'All System Appointments' 
              : 'My Appointments'}
          </h1>
        </div>
        {user?.role !== 'counselor' && user?.role !== 'admin' && (
          <div className="col-auto">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowBookingForm(!showBookingForm)}
            >
              {showBookingForm ? 'Cancel' : 'Book New Appointment'}
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Booking Form (Users Only) */}
      {showBookingForm && user?.role !== 'counselor' && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h4 className="card-title mb-4">Book New Appointment</h4>
            <form onSubmit={handleBookAppointment}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Select Counselor *</label>
                  <select 
                    className="form-select" 
                    value={selectedCounselor}
                    onChange={(e) => setSelectedCounselor(e.target.value)}
                    required
                  >
                    <option value="">Choose a counselor...</option>
                    {counselors.map(counselor => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.username || counselor.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Date *</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Time *</label>
                  <input 
                    type="time"
                    className="form-control"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for appointment or any specific concerns..."
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <svg width="64" height="64" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
              <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
          </div>
          <h4 className="text-muted">No appointments yet</h4>
          <p className="text-muted">
            {user?.role === 'counselor' 
              ? 'No patients have booked appointments with you yet.' 
              : 'Book your first appointment with a counselor to get started.'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {appointments.map(appointment => (
            <div key={appointment.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">
                      {user?.role === 'admin' 
                        ? 'Appointment Details'
                        : user?.role === 'counselor' 
                        ? `Patient: ${appointment.user?.username || 'Unknown'}`
                        : `Counselor: ${appointment.counselor?.username || 'Unknown'}`}
                    </h5>
                    <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  {/* Show full details for admins - both counselor and user */}
                  {user?.role === 'admin' && (
                    <div className="mb-3 small">
                      {appointment.counselor && (
                        <div className="mb-2">
                          <div className="text-muted"><strong>Counselor:</strong></div>
                          <div><strong>Name:</strong> {appointment.counselor.fullName || appointment.counselor.username}</div>
                          <div><strong>Email:</strong> {appointment.counselor.email}</div>
                        </div>
                      )}
                      {appointment.user && (
                        <div className="mt-2">
                          <div className="text-muted"><strong>Patient:</strong></div>
                          <div><strong>Name:</strong> {appointment.user.fullName || appointment.user.username}</div>
                          <div><strong>Email:</strong> {appointment.user.email}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show full details for counselors */}
                  {user?.role === 'counselor' && appointment.user && (
                    <div className="mb-3 small text-muted">
                      <div><strong>Name:</strong> {appointment.user.fullName}</div>
                      <div><strong>Email:</strong> {appointment.user.email}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="text-muted small">Scheduled for:</div>
                    <div className="fw-semibold">{formatDateTime(appointment.scheduledAt)}</div>
                  </div>

                  {/* Reschedule Form */}
                  {rescheduling === appointment.id && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6>Reschedule Appointment</h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <input 
                            type="date"
                            className="form-control form-control-sm"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="col-6">
                          <input 
                            type="time"
                            className="form-control form-control-sm"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <button 
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleReschedule(appointment.id)}
                        >
                          Confirm
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setRescheduling(null);
                            setNewDate('');
                            setNewTime('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 flex-wrap">
                    {/* Counselor Actions */}
                    {user?.role === 'counselor' && appointment.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                        >
                          Confirm
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {user?.role === 'counselor' && appointment.status === 'confirmed' && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                      >
                        Mark Complete
                      </button>
                    )}

                    {/* User Actions */}
                    {user?.role !== 'counselor' && user?.role !== 'admin' && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            if (rescheduling === appointment.id) {
                              setRescheduling(null);
                              setNewDate('');
                              setNewTime('');
                            } else {
                              setRescheduling(appointment.id);
                            }
                          }}
                        >
                          {rescheduling === appointment.id ? 'Cancel Reschedule' : 'Reschedule'}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
