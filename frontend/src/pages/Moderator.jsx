import React, { useState, useEffect, useCallback } from "react";
import { reportApi } from "../api";
import Toast from "../components/Toast";
import { getUserFromToken } from "../utils/auth";
import "../styles/Moderator.css";

function Moderator() {
  const user = getUserFromToken();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [moderatorNote, setModeratorNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  // Memoize fetchReports to prevent infinite loop
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportApi.getReports();
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setToastMessage("Raporlar yüklenemedi");
      setToastType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reports only on component mount
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      setToastMessage("Bu sayfaya erişim yetkiniz yok");
      setToastType("error");
      return;
    }
    fetchReports();
  }, []); // Empty dependency - fetch only once on mount

  const handleAction = async (reportId, action) => {
    if (!moderatorNote.trim() && action !== "ignore") {
      setToastMessage("Lütfen moderatör notu girin");
      setToastType("error");
      return;
    }

    setActionInProgress(true);
    try {
      await reportApi.actionReport(reportId, action, moderatorNote);
      setToastMessage(`İşlem başarılı (${action})`);
      setToastType("success");
      setSelectedReport(null);
      setModeratorNote("");
      // Refresh reports after action
      await fetchReports();
    } catch (error) {
      console.error("Error processing report:", error);
      setToastMessage("İşlem gerçekleştirilemedi");
      setToastType("error");
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus === "all") return true;
    return report.status === filterStatus;
  });

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="moderator-container">
        <p>Bu sayfaya erişim yetkiniz yok</p>
      </div>
    );
  }

  return (
    <div className="moderator-container">
      <div className="moderator-header">
        <h2>📋 Moderatör Paneli - Raporlar</h2>
        <div className="report-stats">
          <span className="stat-badge pending">
            ⏳ Beklemede: {reports.filter(r => r.status === "pending").length}
          </span>
          <span className="stat-badge reviewed">
            ✓ İncelendi: {reports.filter(r => r.status === "reviewed").length}
          </span>
          <span className="stat-badge ignored">
            - Görmezden: {reports.filter(r => r.status === "ignored").length}
          </span>
        </div>
      </div>

      <div className="filter-section">
        <button
          className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
          onClick={() => setFilterStatus("pending")}
        >
          Beklemede
        </button>
        <button
          className={`filter-btn ${filterStatus === "reviewed" ? "active" : ""}`}
          onClick={() => setFilterStatus("reviewed")}
        >
          İncelendi
        </button>
        <button
          className={`filter-btn ${filterStatus === "ignored" ? "active" : ""}`}
          onClick={() => setFilterStatus("ignored")}
        >
          Görmezden Gelinen
        </button>
        <button
          className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          Tümü
        </button>
      </div>

      {loading ? (
        <p className="loading">Raporlar yükleniyor...</p>
      ) : filteredReports.length === 0 ? (
        <p className="no-reports">Bu kategoride rapor bulunamadı</p>
      ) : (
        <div className="reports-list">
          {filteredReports.map(report => (
            <div key={report.id} className={`report-item status-${report.status}`}>
              <div className="report-header-info">
                <span className={`status-badge ${report.status}`}>
                  {report.status === "pending" ? "⏳ Beklemede" : 
                   report.status === "reviewed" ? "✓ İncelendi" : 
                   "- Görmezden Gelindi"}
                </span>
                <span className="report-id">Report #{report.id}</span>
              </div>

              <div className="report-content">
                <div className="report-section">
                  <strong>🚩 Sebep:</strong> {report.reason}
                </div>
                
                {report.description && (
                  <div className="report-section">
                    <strong>📝 Açıklama:</strong> {report.description}
                  </div>
                )}

                <div className="report-section">
                  <strong>📱 Raporlayan:</strong> {report.reporter_username}
                </div>

                <div className="report-section">
                  <strong>🎯 Post Başlığı:</strong> {report.note_title}
                </div>

                <div className="report-section">
                  <strong>👤 Post Sahibi:</strong> {report.note_author}
                </div>

                <div className="report-section">
                  <strong>📅 Tarih:</strong> {new Date(report.created_at).toLocaleString("tr-TR")}
                </div>

                {report.moderator_note && (
                  <div className="report-section">
                    <strong>🔍 Moderatör Notu:</strong> {report.moderator_note}
                  </div>
                )}

                {report.reviewed_by && (
                  <div className="report-section">
                    <strong>✋ İnceleyen:</strong> {report.reviewed_by}
                  </div>
                )}
              </div>

              <button
                className="expand-btn"
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
              >
                {selectedReport?.id === report.id ? "▲ Kapat" : "▼ İşlem Yap"}
              </button>

              {selectedReport?.id === report.id && (
                <div className="report-action-panel">
                  <textarea
                    placeholder="Moderatör notu (opsiyonel)..."
                    value={moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    className="moderator-note-input"
                    maxLength="500"
                    rows="3"
                    disabled={actionInProgress}
                  />
                  <div className="char-count">{moderatorNote.length}/500</div>

                  <div className="action-buttons">
                    <button
                      className="action-btn ignore"
                      onClick={() => handleAction(report.id, "ignore")}
                      disabled={actionInProgress}
                      title="Raporu görmezden gel"
                    >
                      ✋ Görmezden Gel
                    </button>

                    <button
                      className="action-btn restrict"
                      onClick={() => handleAction(report.id, "restrict")}
                      disabled={actionInProgress}
                      title="Kullanıcıyı kısıtla"
                    >
                      🔒 Kısıtla
                    </button>

                    {report.note_author_status === "restricted" && (
                      <button
                        className="action-btn unrestrict"
                        onClick={() => handleAction(report.id, "unrestrict")}
                        disabled={actionInProgress}
                        title="Kısıtlamayı kaldır"
                      >
                        🔓 Kısıtlamayı Kaldır
                      </button>
                    )}

                    <button
                      className="action-btn ban"
                      onClick={() => handleAction(report.id, "ban")}
                      disabled={actionInProgress}
                      title="Kullanıcıyı yasakla"
                    >
                      ⛔ Yasakla
                    </button>

                    <button
                      className="action-btn delete"
                      onClick={() => handleAction(report.id, "delete_post")}
                      disabled={actionInProgress}
                      title="Postu sil"
                    >
                      🗑️ Postu Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
          duration={3000}
        />
      )}
    </div>
  );
}

export default Moderator;
