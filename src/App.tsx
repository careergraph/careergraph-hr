import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "@/pages/AuthPages/SignIn";
import SignUp from "@/pages/AuthPages/SignUp";
import UserProfiles from "@/pages/Profile/UserProfiles";
import Calendar from "@/pages/Calendar/Calendar";
import AppLayout from "@/layout/AppLayout";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import Home from "@/pages/Dashboard/Home";
import EmployeesTable from "@/pages/Employees/EmployeesTable";
import Candidates from "@/pages/Kanban/Candidates";
import JobsGrid from "@/pages/Job/JobsGrid";
import AddJob from "@/pages/Job/AddJob";
import { Toaster } from "sonner";
import SuggestionCandidates from "@/pages/SuggestionCandidate/SuggestionCandidate";
import RequireAuth from "@/components/auth/RequireAuth";
import LandingPage from "@/pages/Landing/LandingPage";

export default function App() {
  return (
    <>
      <Toaster richColors />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route index element={<LandingPage />} />

          <Route element={<RequireAuth redirectTo="/signin" />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/kanbans" element={<Candidates />} />
              <Route path="/kanbans/:jobId" element={<Candidates />} />
              <Route path="/jobs" element={<JobsGrid />} />
              <Route path="/jobs/new" element={<AddJob />} />
              <Route path="/employees" element={<EmployeesTable />} />
              <Route path="/candidates" element={<SuggestionCandidates />} />
            </Route>
          </Route>

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}
