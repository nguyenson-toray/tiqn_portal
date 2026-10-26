import React, { useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Page, Box } from "zmp-ui";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import PullToRefresh from "@/components/PullToRefresh";
import { useAtomValue } from "jotai";
import { isReadOnlyAtom } from "@/store/auth";

import CalendarTabContent from "./tabs/CalendarTabContent";
import SummaryTabContent from "./tabs/SummaryTabContent";

const TAB_ITEMS = [
  { key: "calendar", label: "Chi tiết" },
  { key: "summary", label: "Tổng hợp" },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]["key"];

function getInitialTab(pathname: string): TabKey {
  if (pathname.includes("/attendance/summary")) return "summary";
  return "calendar";
}

const AttendancePage: React.FC = () => {
  const location = useLocation();
  const isReadOnly = useAtomValue(isReadOnlyAtom);
  const [activeTab, setActiveTab] = useState<TabKey>(() => getInitialTab(location.pathname));

  // Each tab registers its refresh function
  const refreshFnRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefresh = useCallback(async () => {
    if (refreshFnRef.current) await refreshFnRef.current();
  }, []);

  const registerRefresh = useCallback((fn: () => Promise<void>) => {
    refreshFnRef.current = fn;
  }, []);

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      {isReadOnly && <ReadOnlyBanner />}

      <AppHeader title="Chấm công" />

      {/* Tabs */}
      <Box className="bg-white border-b border-gray-100">
        <Box className="flex">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${tab.key === activeTab
                  ? "text-[#006AF5] border-b-2 border-[#006AF5]"
                  : "text-gray-500"
                }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </Box>
      </Box>

      {/* Tab Content */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1 px-4 pt-3 pb-24 space-y-3">
        {activeTab === "calendar" && <CalendarTabContent registerRefresh={registerRefresh} />}
        {activeTab === "summary" && <SummaryTabContent registerRefresh={registerRefresh} />}
      </PullToRefresh>

      <BottomNav />
    </Page>
  );
};

export default AttendancePage;
