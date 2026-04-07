import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Complaints from "./pages/Complaints";
import Fees from "./pages/Fees";
import Announcements from "./pages/Announcements";
import Students from "./pages/Students";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Allocations from "./pages/Allocations";
import Download from "./pages/Download";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/download" element={<ProtectedRoute><Download /></ProtectedRoute>} />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute>
              <Fees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={["admin", "warden"]}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "warden"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
         path="/allocations" 
         element={
            <ProtectedRoute>
              <Allocations />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}