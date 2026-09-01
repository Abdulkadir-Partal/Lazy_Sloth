import React, { useEffect } from "react";
import "../styles/Toast.css";

function Toast({ message, type = "success", onClose, autoClose = true, duration = 3000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
