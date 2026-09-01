import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/PomodoroCard.css";

function PomodoroCard({ username, isOwnProfile }) {
  const [stats, setStats] = useState(null);
  const [timeGoals, setTimeGoals] = useState([]);
  const [taskGoals, setTaskGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTimeIds, setCompletingTimeIds] = useState([]);
  const [completingTaskIds, setCompletingTaskIds] = useState([]);
  

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchPomodoroData = async () => {
      try {
        const [statsRes, timeGoalsRes, taskGoalsRes] = await Promise.all([
          api.get(`/api/user/${username}/pomodoro/stats/`),
          api.get(`/api/user/${username}/goals/time/`),
          api.get(`/api/user/${username}/goals/tasks/`),
        ]);

        setStats(statsRes.data);
        setTimeGoals(timeGoalsRes.data || []);
        setTaskGoals(taskGoalsRes.data || []);
      } catch (err) {
        console.error("Pomodoro verilerini çekme hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPomodoroData();
  }, [username]);

  if (loading) return null;

  // Eğer hiçbir veri yoksa gösterme
  if (!stats || (stats.daily.session_count === 0 && stats.weekly.session_count === 0 && 
      timeGoals.length === 0 && taskGoals.length === 0)) {
    return null;
  }

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
    });
  };

  // Handlers for completing goals (optimistic UI update)
  async function handleCompleteTimeGoal(id) {
    if (completingTimeIds.includes(id)) return;
    setCompletingTimeIds((s) => [...s, id]);
    try {
      await api.post(`api/goals/time/${id}/complete/`);
      setTimeGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: 'completed', progress: g.progress ? { ...g.progress, percentage: 100 } : g.progress } : g)));
    } catch (err) {
      console.error('Time goal complete failed', err);
      alert('Hedef tamamlanamadı. Tekrar deneyin.');
    } finally {
      setCompletingTimeIds((s) => s.filter((i) => i !== id));
    }
  }

  

  async function handleCompleteTaskGoal(id) {
    if (completingTaskIds.includes(id)) return;
    setCompletingTaskIds((s) => [...s, id]);
    try {
      await api.post(`api/goals/tasks/${id}/complete/`);
      setTaskGoals((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)));
    } catch (err) {
      console.error('Task goal complete failed', err);
      alert('Görev tamamlanamadı. Tekrar deneyin.');
    } finally {
      setCompletingTaskIds((s) => s.filter((i) => i !== id));
    }
  }

  

  return (
    <div className="pomodoro-cards-section">
      <h3>📚 Pomodoro İstatistikleri</h3>

      {/* Stats Cards */}
      <div className="pomodoro-stats-grid">
        {/* Daily Stats */}
        <div className="stat-card daily-card">
          <div className="stat-header">Bugün</div>
          <div className="stat-value">{formatDuration(stats.daily.total_duration)}</div>
          <div className="stat-label">{stats.daily.session_count} seansa</div>
        </div>

        {/* Weekly Stats */}
        <div className="stat-card weekly-card">
          <div className="stat-header">Bu Hafta</div>
          <div className="stat-value">{formatDuration(stats.weekly.total_duration)}</div>
          <div className="stat-label">{stats.weekly.session_count} seansa</div>
        </div>
      </div>

      {/* Son seanslar profil sayfasında gösterilmiyor (istek üzerine gizlendi) */}

      {/* Time Goals */}
      {timeGoals.length > 0 && (
        <div className="pomodoro-section">
          <h4>Zaman Hedefleri</h4>
          <div className="goals-list">
            {timeGoals.slice(0, 5).map((goal) => (
              <div key={goal.id} className={`goal-item time-goal ${goal.status}`}>
                <div className="goal-header">
                  <span className="goal-period">{goal.period === 'daily' ? '📅' : '📅'}</span>
                  <span className="goal-title">{goal.target_minutes} dakika</span>
                </div>
                {/* Progress hidden on profile per request (no percentage shown) */}
                <div className="goal-meta">
                  <span className={`status-badge ${goal.status}`}>
                    {goal.status === 'completed' ? '✓ Tamamlandı' :
                     goal.status === 'missed' ? '✗ Kaçırıldı' : '⏳ Devam Ediyor'}
                  </span>
                  {/* Manual completion for time goals disabled on profile */}
                  {/* share handled on Pomodoro page instead of profile */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Goals */}
      {taskGoals.length > 0 && (
        <div className="pomodoro-section">
          <h4>Görev Hedefleri</h4>
          <div className="goals-list">
            {taskGoals.slice(0, 5).map((task) => (
              <div key={task.id} className={`goal-item task-goal ${task.status}`}>
                <div className="goal-header">
                  <span className="goal-period">{task.period === 'daily' ? '📅' : '📅'}</span>
                  <span className="goal-title">{task.title}</span>
                </div>
                <div className="goal-meta">
                  <span className={`status-badge ${task.status}`}>
                    {task.status === 'completed' ? '✓ Tamamlandı' :
                     task.status === 'missed' ? '✗ Kaçırıldı' : '⏳ Devam Ediyor'}
                  </span>
                  {isOwnProfile && task.status === 'pending' && (
                    <button
                      className="goal-complete-btn"
                      onClick={() => handleCompleteTaskGoal(task.id)}
                      disabled={completingTaskIds.includes(task.id)}
                    >
                      {completingTaskIds.includes(task.id) ? 'Kaydediliyor...' : 'Tamamla'}
                    </button>
                  )}
                  {/* share handled on Pomodoro page instead of profile */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}

export default PomodoroCard;
