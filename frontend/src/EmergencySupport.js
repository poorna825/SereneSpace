import { useState } from "react";

export default function EmergencySupport() {
  const [showMessage, setShowMessage] = useState(false);

  const handleEmergencyClick = () => {
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  return (
    <div className="text-center mt-4">
      <button
        className="btn btn-danger btn-lg px-5 py-3 shadow-lg"
        style={{ fontWeight: "bold", fontSize: "1.2rem", borderRadius: "12px" }}
        onClick={handleEmergencyClick}
      >
        🚨 Emergency Support
      </button>

      {showMessage && (
        <div
          className="alert alert-danger mt-3 mx-auto shadow"
          style={{ maxWidth: "500px", borderRadius: "10px" }}
          role="alert"
        >
          Counsellor has been notified. Please wait...
        </div>
      )}
    </div>
  );
}
