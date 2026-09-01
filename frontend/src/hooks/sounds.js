// hooks/sounds.js
import { useRef } from "react";

const SOUND_PATHS = {
  success: [
    "/sounds/success1.mp3",
    "/sounds/success2.mp3",
  ],
  error: [
    "/sounds/error1.mp3",
    "/sounds/error2.mp3",
  ],
  alarm: [
    "/sounds/alarm.mp3",
  ],
};

export default function useSounds() {
  const audioUnlockedRef = useRef(false);
  const audioRef = useRef(null);

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;

    const audio = new Audio(SOUND_PATHS.alarm[0]);
    audio.volume = 0.8;

    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audioUnlockedRef.current = true;
        audioRef.current = audio;
      })
      .catch(() => {});
  };

  const playRandom = (type) => {
    if (!audioUnlockedRef.current) return;

    const sounds = SOUND_PATHS[type];
    if (!sounds || sounds.length === 0) return;

    const src = sounds[Math.floor(Math.random() * sounds.length)];
    const audio = new Audio(src);
    audio.volume = 0.8;
    audio.play().catch(() => {});
  };

  return {
    unlockAudio,
    playSuccess: () => playRandom("success"),
    playError: () => playRandom("error"),
    playAlarm: () => playRandom("alarm"),
  };
}
