import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Navbar.css";
import { getUserFromToken } from "../utils/auth";
import api from "../api";

export default function Navbar() {
  const location = useLocation();
  const user = getUserFromToken();
  const isAuthenticated = user !== null;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      api
        .get(`/api/profile/${user.user_id}/`)
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => {
          console.error("Profil çekme hatası:", err);
        });
    }
  }, [isAuthenticated, user?.user_id]);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="nav-logo-icon" aria-hidden="true">🦥</span>
        <span className="nav-logo-text">Lazy Sloth</span>
      </Link>

      <ul className="nav-links">

        <li className={location.pathname === "/" ? "active" : ""}>
          <Link to="/">Home</Link>
        </li>

        {user?.status === "active" && (
          <li className={location.pathname === "/create-note" ? "active" : ""}>
            <Link to="/create-note">Create Note</Link>
          </li>
        )}

        {user?.status === "restricted" && (
          <li>
            <Link to="/create-note">Create Note</Link>
          </li>
        )}

        {isAuthenticated && (
          <li className={location.pathname === "/products" ? "active" : ""}>
            <Link to="/products">🛍️ Ürünler</Link>
          </li>
        )}

        {user?.role === "user" && (
          <li className={location.pathname === "/cart" ? "active" : ""}>
            <Link to="/cart">🛒 Sepet</Link>
          </li>
        )}

        {user?.role === "admin" && (
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        )}

        {user?.role === "moderator" && (
          <li>
            <Link to="/moderator">Moderator</Link>
          </li>
        )}

        {!isAuthenticated && (
          <li className={location.pathname === "/login" ? "active" : ""}>
            <Link to="/login">Login</Link>
          </li>
        )}

        {isAuthenticated && (
          <>
            {/* PROFIL AVATAR */}
            <li className={location.pathname === "/pomodoro" ? "active" : ""}>
              <Link to="/pomodoro">Pomodoro</Link>
            </li>
            <li>
              <Link to={`/profile/${user.username}`}>
                <img
                  src={profile?.avatar || "/default-avatar.png"}
                  alt="profile"
                  className="profile-avatar"
                />
              </Link>
            </li>

            <li>
              <Link to="/logout">Logout</Link>
            </li>
          </>
        )}

      </ul>
    </nav>
  );
}
