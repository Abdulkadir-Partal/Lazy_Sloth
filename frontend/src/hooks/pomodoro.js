import { useEffect, useRef, useState } from "react";
import api from "../api";
import useSounds from "./sounds";

export default function usePomodoro() {
  /* -------------------- STATE -------------------- 1111111111111111111*/
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(null);

  const [stats, setStats] = useState({
    daily: { total_duration: 0, session_count: 0 },
    weekly: { total_duration: 0, session_count: 0 },
  });

  /* -------------------- REFS -------------------- */
  const intervalRef = useRef(null);

  /* -------------------- SOUNDS -------------------- */
  const { unlockAudio, playAlarm, playSuccess } = useSounds();

  /* -------------------- STATS -------------------- */
  const fetchPomodoroStats = async () => {
    const res = await api.get("api/pomodoro/stats/");
    setStats(res.data);
  };

  useEffect(() => {
    fetchPomodoroStats();
  }, []);

  /* -------------------- TIMER -------------------- */
  useEffect(() => {
    if (!isRunning || !session) return;

    intervalRef.current = setInterval(() => {
      const elapsedSec = Math.floor(
        (Date.now() - session.startedAt) / 1000
      );

      const remaining = session.durationSec - elapsedSec;

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setTimeLeft(0);
        completePomodoro(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, session]);


  // Süre değişirse (çalışmıyorken) resetle
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, isRunning]);

  /* -------------------- START -------------------- */
  const startPomodoro = async () => {
    unlockAudio();

    const res = await api.post("api/pomodoro/start/", {
      duration: durationMinutes,
    });

    const startedAt = Date.now();

    setSession({
      id: res.data.id,
      startedAt,
      durationSec: durationMinutes * 60,
    });

    setIsRunning(true);
  };


  /* -------------------- COMPLETE / CANCEL -------------------- */
  const sendResult = async (completed) => {
    if (!session) return;

    const workedMinutes = Math.floor(
      (Date.now() - session.startedAt) / 60000
    );

    const endpoint = completed
      ? `api/pomodoro/complete/${session.id}/`
      : `api/pomodoro/cancel/${session.id}/`;

    await api.post(endpoint, { actual_duration: workedMinutes });

    setSession(null);          // 🔥 KRİTİK
    fetchPomodoroStats();
  };


  const completePomodoro = async (auto = false) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    // 🔊 SESİ ÖNCE BAŞLAT
    if (auto) {
      playAlarm();
    } else {
      playSuccess();
    }

    // ⏳ Alert'i bir tick geciktir
    setTimeout(() => {
      alert(auto ? "⏰ Süre doldu!" : "🎉 Görev tamamlandı!");
    }, 50);

    await sendResult(true);
  };


  const cancelPomodoro = async () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    await sendResult(false);
  };

  /* -------------------- EXPORT -------------------- */
  return {
    timeLeft,
    isRunning,
    durationMinutes,
    setDurationMinutes,
    stats,
    startPomodoro,
    completePomodoro,
    cancelPomodoro,
  };
}

