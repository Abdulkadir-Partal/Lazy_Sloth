import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";
import { getUserFromToken } from "../utils/auth";

function ProtectedRoute({ children, allowedRoles }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    const res = await api.post("/api/token/refresh/", { refresh });
    localStorage.setItem(ACCESS_TOKEN, res.data.access);
    return res.data.access;
  };

  const checkAuth = async () => {
    try {
      let token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) return setIsAuthorized(false);

      let decoded = jwtDecode(token);

      if (decoded.exp < Date.now() / 1000) {
        token = await refreshToken();
        decoded = jwtDecode(token);
      }

      const user = getUserFromToken();

      if (!user) return setIsAuthorized(false);

      if (user.status === "banned") return setIsAuthorized(false);

      if (allowedRoles && !allowedRoles.includes(user.role))
        return setIsAuthorized(false);

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth error:", error);
      setIsAuthorized(false);
    }
  };

  if (isAuthorized === null) return <div>Loading...</div>;

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
