import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import CreateNote from "./pages/CreateNote"
import Admin from "./pages/Admin"
import Moderator from "./pages/Moderator"
import Profile from "./pages/Profile"
import Pomodoro from "./pages/Pomodoro"
import Products from "./pages/Products"
import Cart from "./pages/CartNew"

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div style={{ paddingTop: "80px" }}>
        <Routes>

          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/create-note" element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          } />

          <Route path="/moderator" element={
            <ProtectedRoute allowedRoles={["admin","moderator"]}>
              <Moderator />
            </ProtectedRoute>
          } />

          {/* PROFIL */}
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/pomodoro" element={
            <ProtectedRoute>
              <Pomodoro />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
