import React, { useEffect, useState } from "react";
import "../styles/ShareModal.css";

function ShareModal({ open, title = "Paylaş", initialText = "", onClose, onSubmit, submitting = false }) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText || "");
  }, [initialText, open]);

  if (!open) return null;

  return (
    <div className="share-modal-overlay" onMouseDown={onClose}>
      <div className="share-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <textarea
          placeholder="Paylaşmak istediğiniz ek notu buraya yazın (opsiyonel)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="share-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={submitting}>
            İptal
          </button>
          <button className="btn-submit" onClick={() => onSubmit(text)} disabled={submitting}>
            {submitting ? "Gönderiliyor..." : "Paylaş"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
