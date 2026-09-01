export function getUserFromToken() {
  const token = localStorage.getItem("access");
  if (!token) return null;

  const payload = JSON.parse(atob(token.split(".")[1]));

  return {
    user_id: payload.user_id,
    role: payload.role,
    status: payload.status,
    username: payload.username,
    avatar: payload.avatar,
  };
}
