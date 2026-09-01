import React, { useState } from "react";
import { reportApi } from "../api";
import "../styles/ReportModal.css";

function ReportModal({ noteId, authorId, currentUserId, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reasonOptions = [
    { value: "spam", label: "🔔 Spam" },
    { value: "harassment", label: "😠 Taciz" },
    { value: "hate", label: "🤬 Nefret Söylemi" },
    { value: "violence", label: "⚔️ Şiddet" },
    { value: "nudity", label: "🔞 Uygunsuz İçerik" },
    { value: "fake", label: "🤥 Yalan Bilgi" },
    { value: "other", label: "❓ Diğer" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError("Lütfen bir sebep seçiniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await reportApi.createReport(noteId, reason, description);
      onSuccess("Rapor başarıyla gönderildi");
      onClose();
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error || "Rapor gönderilemedi");
      } else {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Post Rapor Et</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="report-error">{error}</div>}

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="reason">Sebep *</label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="reason-select"
              disabled={loading}
            >
              <option value="">Sebep seçiniz...</option>
              {reasonOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Açıklama (opsiyonel)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ek bilgi varsa yazınız... (maksimum 500 karakter)"
              className="description-textarea"
              maxLength="500"
              rows="4"
              disabled={loading}
            />
            <div className="char-count">{description.length}/500</div>
          </div>

          <div className="report-modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !reason}
            >
              {loading ? "Gönderiliyor..." : "Rapor Et"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
