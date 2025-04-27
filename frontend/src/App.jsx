import { useEffect, lazy, Suspense } from "react";
import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import LoginFirst from "./pages/LoginFirst";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BookingTypes = lazy(() => import("./pages/BookingTypes"));
const Settings = lazy(() => import("./pages/Settings"));
const ClientBooking = lazy(() => import("./pages/ClientBooking"));
const SetAvail = lazy(() => import("./pages/SetAvail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyBookings = lazy(() => import("./pages/MyBookings"));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/overview" replace /> : children;
};

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // console.log("User in app:", user);
  // console.log("Loading in app:", loading);
  //console.log("Location in app:", location.pathname);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route path="/book/:bookingTypeId" element={<ClientBooking />} />
        <Route path="/auth/" element={<LoginFirst />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="booking-types" element={<BookingTypes />} />
          <Route path="availability" element={<SetAvail />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
