import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "@/pages/AuthPages/SignIn";
import SignUp from "@/pages/AuthPages/SignUp";
import UserProfiles from "@/pages/Profile/UserProfiles";
import Videos from "@/pages/UiElements/Videos";
import Images from "@/pages/UiElements/Images";
import Alerts from "@/pages/UiElements/Alerts";
import Badges from "@/pages/UiElements/Badges";
import Avatars from "@/pages/UiElements/Avatars";
import Buttons from "@/pages/UiElements/Buttons";
import LineChart from "@/pages/Charts/LineChart";
import BarChart from "@/pages/Charts/BarChart";
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

export default function App() {
  return (
    <>
      <Toaster richColors />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />

            {/* Calendar */}
            <Route path="/calendar" element={<Calendar />} />

            {/* Candidates */}
            <Route path="/candidates" element={<Candidates />} />

            {/* Jobs */}
            <Route path="/jobs" element={<JobsGrid />} />
            <Route path="/jobs/new" element={<AddJob />} />

            {/* Employees */}
            <Route path="/employees" element={<EmployeesTable />} />

            {/* Suggestion Candidates */}
            <Route path="/suggestion" element={<SuggestionCandidates />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </>
  );
}
