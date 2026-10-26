import React from "react";
import {
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { Routes } from "react-router-dom";

import SplashPage from "@/pages/SplashPage";
import IntroPage from "@/pages/login/IntroPage";
import PhoneDeniedPage from "@/pages/login/PhoneDeniedPage";
import NoPhonePage from "@/pages/login/NoPhonePage";
import NotFoundPage from "@/pages/login/NotFoundPage";
import DeactivatedPage from "@/pages/login/DeactivatedPage";
import UpdateRequiredPage from "@/pages/login/UpdateRequiredPage";
import HomePage from "@/pages/home/HomePage";
import OAInvitePage from "@/pages/home/OAInvitePage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import AccountPage from "@/pages/account/AccountPage";
import LeavePage from "@/pages/leave/LeavePage";
import CreateLeavePage from "@/pages/leave/CreateLeavePage";
import LeaveDetailPage from "@/pages/leave/LeaveDetailPage";
import AttendancePage from "@/pages/attendance/AttendancePage";
import AttendanceDayPage from "@/pages/attendance/AttendanceDayPage";
import CreateExplanationPage from "@/pages/attendance/CreateExplanationPage";
import PayslipListPage from "@/pages/payslip/PayslipListPage";
import PayslipDetailPage from "@/pages/payslip/PayslipDetailPage";

const Layout = () => {
  return (
    <App theme="light">
      <SnackbarProvider>
        <ZMPRouter>
          <Routes>
            {/* Splash / Init */}
            <Route path="/" element={<SplashPage />} />

            {/* Auth screens */}
            <Route path="/login" element={<IntroPage />} />
            <Route path="/login/phone-denied" element={<PhoneDeniedPage />} />
            <Route path="/login/no-phone" element={<NoPhonePage />} />
            <Route path="/login/not-found" element={<NotFoundPage />} />
            <Route path="/login/deactivated" element={<DeactivatedPage />} />
            <Route path="/update-required" element={<UpdateRequiredPage />} />

            {/* Main screens */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/oa-invite" element={<OAInvitePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/account" element={<AccountPage />} />

            {/* Leave */}
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/leave/create" element={<CreateLeavePage />} />
            <Route path="/leave/:id" element={<LeaveDetailPage />} />

            {/* Attendance */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/summary" element={<AttendancePage />} />
            {/* /attendance/overtime → redirect to main attendance page */}
            <Route path="/attendance/overtime" element={<AttendancePage />} />
            <Route path="/attendance/day/:date" element={<AttendanceDayPage />} />
            <Route path="/attendance/explain/:date" element={<CreateExplanationPage />} />

            {/* Payslip */}
            <Route path="/payslip" element={<PayslipListPage />} />
            <Route path="/payslip/:period" element={<PayslipDetailPage />} />
          </Routes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};

export default Layout;
