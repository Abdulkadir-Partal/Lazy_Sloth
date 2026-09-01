import { useEffect, useState } from "react";
import api from "../api";

export default function usePomodoroStats(refreshTrigger) {
  const [stats, setStats] = useState({
    daily: { total_duration: 0, session_count: 0 },
    weekly: { total_duration: 0, session_count: 0 },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/pomodoro/stats/");
        setStats(res.data);
      } catch (err) {
        console.error("Pomodoro stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]); // 👈 pomodoro tamamlanınca yenilensin

  return { stats, loading };
}
