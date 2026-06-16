import { useEffect } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { useAuthStore } from "./store/useAuthStore";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollMemory } from "./components/ScrollMemory";
import { AppLayout } from "./layouts/AppLayout";
import { Auth } from "./pages/Auth";
import { Assistant } from "./pages/Assistant";
import { Dashboard } from "./pages/Dashboard";
import { EmployeeForm } from "./pages/EmployeeForm";
import { Employees } from "./pages/Employees";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Landing } from "./pages/Landing";
import { PayrollHistory } from "./pages/PayrollHistory";
import { PayrollRun } from "./pages/PayrollRun";
import { ResetPassword } from "./pages/ResetPassword";
import { Settings } from "./pages/Settings";

const protectedPage = (page: ReactElement) => (
  <ProtectedRoute>{page}</ProtectedRoute>
);

export default function App() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <BrowserRouter>
      <ScrollMemory />
      <AppLayout>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Auth mode="login" />
              )
            }
          />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Auth mode="signup" />
              )
            }
          />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
          <Route path="/employees" element={protectedPage(<Employees />)} />
          <Route
            path="/employees/new"
            element={protectedPage(<EmployeeForm />)}
          />
          <Route
            path="/employees/:id/edit"
            element={protectedPage(<EmployeeForm />)}
          />
          <Route path="/payroll/run" element={protectedPage(<PayrollRun />)} />
          <Route
            path="/payroll/history"
            element={protectedPage(<PayrollHistory />)}
          />
          <Route
            path="/payroll/history/:month"
            element={protectedPage(<PayrollHistory />)}
          />
          <Route path="/assistant" element={protectedPage(<Assistant />)} />
          <Route path="/settings" element={protectedPage(<Settings />)} />
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/"} replace />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
