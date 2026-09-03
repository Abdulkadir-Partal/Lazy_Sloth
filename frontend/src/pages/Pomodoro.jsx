import { useState, useEffect } from "react";
import usePomodoro from "../hooks/pomodoro";
import "../styles/Pomodoro.css";
import api from "../api";
import ShareModal from "../components/ShareModal";
import Toast from "../components/Toast";
import { getUserFromToken } from "../utils/auth";

export default function Pomodoro() {
  const {
    timeLeft,
    isRunning,
    durationMinutes,
    setDurationMinutes,
    stats,
    startPomodoro,
    completePomodoro,
    cancelPomodoro,
  } = usePomodoro();

  const [editing, setEditing] = useState(false);
  const [timeGoals, setTimeGoals] = useState([]);
  const [taskGoals, setTaskGoals] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPeriod, setNewTaskPeriod] = useState("daily");
  const [newTimeTarget, setNewTimeTarget] = useState(25);
  const [newTimePeriod, setNewTimePeriod] = useState("daily");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState({ type: null, id: null, title: "" });
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const currentUser = getUserFromToken();

  useEffect(() => {
    fetchGoals();
  }, [stats]);

  const fetchGoals = async () => {
    try {
      const [timeRes, taskRes] = await Promise.all([
        api.get("api/goals/time/"),
        api.get("api/goals/tasks/"),
      ]);
      // Copy goals to local arrays
      let newTimeGoals = (timeRes.data || []).slice();
      const newTaskGoals = taskRes.data || [];

      // Otomatik tikleme: TimeGoal'ın progress >= 100% ve status pending ise complete et
      for (let i = 0; i < newTimeGoals.length; i++) {
        const tg = newTimeGoals[i];
        if (tg.progress && tg.progress.percentage >= 100 && tg.status === "pending") {
          try {
            await api.post(`api/goals/time/${tg.id}/complete/`);
            // update local copy immediately so UI reflects completed state
            newTimeGoals[i] = { ...tg, status: "completed", progress: tg.progress ? { ...tg.progress, percentage: 100 } : tg.progress };
          } catch (err) {
            console.error(`Failed to auto-complete time goal ${tg.id}:`, err);
          }
        }
      }

      setTimeGoals(newTimeGoals);
      setTaskGoals(newTaskGoals);
    } catch (err) {
      console.error(err);
    }
  };

  const createTimeGoal = async () => {
    try {
      // Günlük: bugün, Haftalık: bu haftanın pazartesi
      let date = new Date();
      if (newTimePeriod === "weekly") {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
        date = new Date(date.setDate(diff));
      }
      const dateStr = date.toISOString().slice(0, 10);

      await api.post("api/goals/time/", {
        period: newTimePeriod,
        target_minutes: newTimeTarget,
        date: dateStr,
      });
      setNewTimeTarget(25);
      setNewTimePeriod("daily");
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const createTaskGoal = async () => {
    try {
      await api.post("api/goals/tasks/", { title: newTaskTitle, period: newTaskPeriod, date: new Date().toISOString().slice(0,10) });
      setNewTaskTitle("");
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskComplete = async (id) => {
    try {
      await api.post(`api/goals/tasks/${id}/complete/`);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const resetTaskPending = async (id) => {
    try {
      // PATCH ile status'u pending'e geri çek
      await api.patch(`api/goals/tasks/${id}/`, { status: "pending" });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskToggle = async (t) => {
    if (t.status === "completed") {
      // untick → reset to pending
      await resetTaskPending(t.id);
    } else if (t.status === "pending") {
      // tick → mark completed
      await toggleTaskComplete(t.id);
    }
  };

  const deleteTaskGoal = async (id) => {
    try {
      await api.delete(`api/goals/tasks/${id}/`);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTimeGoal = async (id) => {
    try {
      await api.delete(`api/goals/time/${id}/`);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = () =>
    `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const adjustMinutes = (delta) => {
    if (isRunning) return;
    setDurationMinutes((prev) => Math.min(180, Math.max(1, prev + delta)));
  };

  return (
    <div className="pomodoro-page">
      <div className="pomodoro-card">
        <div className="pomodoro-title">Pomodoro</div>

        <div className={`timer ${isRunning ? "locked" : ""}`} onClick={() => !isRunning && setEditing(true)}>
          {formatTime()}
        </div>

        {!isRunning && editing && (
          <div className="time-adjust">
            <button onClick={() => adjustMinutes(-5)}>-5</button>
            <button onClick={() => adjustMinutes(-1)}>-1</button>
            <span className="time-label">{durationMinutes} dk</span>
            <button onClick={() => adjustMinutes(1)}>+1</button>
            <button onClick={() => adjustMinutes(5)}>+5</button>
            <button onClick={() => setEditing(false)}>✓</button>
          </div>
        )}

        <div className="actions">
          {!isRunning ? (
            <button className="btn-start" onClick={startPomodoro}>
              Başlat
            </button>
          ) : (
            <>
              <button className="btn-complete" onClick={completePomodoro}>
                Tamamla
              </button>
              <button className="btn-cancel" onClick={cancelPomodoro}>
                İptal
              </button>
            </>
          )}
        </div>

        <div className="stats">
          <div className="stat-box">
            <div className="stat-title">Bugün</div>
            <div className="stat-value">{stats.daily.total_duration} dk</div>
          </div>

          <div className="stat-box">
            <div className="stat-title">Bu Hafta</div>
            <div className="stat-value">{stats.weekly.total_duration} dk</div>
          </div>
        </div>

        <div className="goals">
          <h3>Hedefler</h3>

          <div className="time-goal">
            <div className="goal-title">Saat Hedefleri</div>
            <ul>
              {timeGoals.map((tg) => {
                const statusColor = tg.status === "completed" ? "green" : tg.status === "missed" ? "red" : "orange";
                return (
                  <li key={tg.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <input 
                      type="checkbox" 
                      checked={tg.status === "completed"} 
                      disabled={true}
                      title="Otomatik tiklenir: hedefe ulaştığında"
                    />
                    <span style={{ textDecoration: tg.status === "completed" ? "line-through" : "none", color: statusColor, flex: 1 }}>
                      {tg.period === "daily" ? "📅" : "📆"} {tg.target_minutes} dk ({tg.period}) - {tg.status}
                    </span>
                    {tg.progress && (
                      <span style={{ fontSize: "0.85em", color: "#666" }}>
                        {tg.progress.actual_minutes}/{tg.target_minutes} dk
                      </span>
                    )}
                    <button onClick={() => deleteTimeGoal(tg.id)} style={{ background: "#ff6b6b", color: "white", border: "none", padding: "4px 8px", cursor: "pointer" }}>
                      Sil
                    </button>
                    {currentUser && currentUser.status !== "restricted" && (
                      <button onClick={() => { setShareTarget({ type: 'time', id: tg.id, title: `Hedef: ${tg.target_minutes}dk` }); setShareModalOpen(true); }} style={{ background: '#1976d2', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer', marginLeft: 8 }}>
                        Paylaş
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="time-goal-add">
              <input type="number" min="1" value={newTimeTarget} onChange={(e) => setNewTimeTarget(Number(e.target.value))} placeholder="Dakika" />
              <select value={newTimePeriod} onChange={(e) => setNewTimePeriod(e.target.value)}>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
              </select>
              <button onClick={createTimeGoal}>Hedef Ekle</button>
            </div>
          </div>

          <div className="task-goals">
            <div className="goal-title">Görevler</div>
            <ul>
              {taskGoals.map((t) => (
                <li key={t.id} style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                  <input 
                    type="checkbox" 
                    checked={t.status === 'completed'} 
                    onChange={() => handleTaskToggle(t)}
                    disabled={t.status === 'missed'}
                  />
                  <span style={{textDecoration: t.status === 'completed' ? 'line-through' : 'none', flex: 1, color: t.status === 'missed' ? 'red' : 'inherit'}}>
                    {t.title} ({t.period})
                  </span>
                  <button onClick={() => deleteTaskGoal(t.id)} style={{ background: "#ff6b6b", color: "white", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: "0.8em" }}>
                    Sil
                  </button>
                  {currentUser && currentUser.status !== "restricted" && (
                    <button onClick={() => { setShareTarget({ type: 'task', id: t.id, title: t.title }); setShareModalOpen(true); }} style={{ background: '#1976d2', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer', marginLeft: 8, fontSize: '0.8em' }}>
                      Paylaş
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="task-add">
              <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Yeni görev" />
              <select value={newTaskPeriod} onChange={(e) => setNewTaskPeriod(e.target.value)}>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
              </select>
              <button
                type="button"
                onClick={createTaskGoal}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                Görev Ekle
              </button>
            </div>
          </div>

          <ShareModal
            open={shareModalOpen}
            title={shareTarget?.title || "Paylaş"}
            initialText={""}
            onClose={() => setShareModalOpen(false)}
            onSubmit={async (text) => {
              setShareSubmitting(true);
              try {
                const url = shareTarget.type === 'time' ? `api/goals/time/${shareTarget.id}/share/` : `api/goals/tasks/${shareTarget.id}/share/`;
                await api.post(url, { extra_note: text });
                setShareModalOpen(false);
                setToast({ message: "Paylaşım başarıyla gönderildi!", type: "success" });
                window.dispatchEvent(new Event('notesChanged'));
              } catch (err) {
                console.error('Share failed', err);
                setToast({ message: "Paylaşım başarısız. Lütfen tekrar deneyin.", type: "error" });
              } finally {
                setShareSubmitting(false);
              }
            }}
            submitting={shareSubmitting}
          />
        </div>
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
