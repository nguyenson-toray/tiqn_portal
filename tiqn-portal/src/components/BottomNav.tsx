import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNavigation, Icon } from "zmp-ui";
import { useAtomValue } from "jotai";
import { configAtom } from "@/store/auth";
import { homeDataAtom } from "@/store/data";
import type { Features } from "@/api/types";

const PayslipIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

interface NavItem {
  key: string;
  label: string;
  icon?: string;
  customIcon?: React.ReactNode;
  feature?: keyof Features;
  always?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: "/home", label: "Trang chủ", icon: "zi-home", always: true },
  { key: "/payslip", label: "Phiếu lương", customIcon: <PayslipIcon />, feature: "payslip" },
  { key: "/attendance", label: "Chấm công", icon: "zi-clock-1", feature: "attendance" },
  { key: "/leave", label: "Nghỉ phép", icon: "zi-note", feature: "leave_view" },
  { key: "/notifications", label: "Thông báo", icon: "zi-notif", feature: "notifications" },
  { key: "/account", label: "Tài khoản", icon: "zi-user", always: true },
];

const BadgeIcon: React.FC<{ icon: string; count: number }> = ({ icon, count }) => (
  <span className="relative inline-flex">
    <Icon icon={icon as any} />
    {count > 0 && (
      <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </span>
);

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAtomValue(configAtom);
  const features = config?.features;
  const home = useAtomValue(homeDataAtom);
  const unread = home?.notifications?.unread || 0;

  const tabs = NAV_ITEMS.filter(
    (item) => item.always || (item.feature && features?.[item.feature]),
  );

  const activeKey = tabs.find((t) => location.pathname.startsWith(t.key))?.key || "/home";

  const getIcon = (tab: NavItem) => {
    if (tab.customIcon) return tab.customIcon;
    if (tab.key === "/notifications") return <BadgeIcon icon={tab.icon!} count={unread} />;
    return <Icon icon={tab.icon as any} />;
  };

  return (
    <BottomNavigation fixed activeKey={activeKey} onChange={(key) => navigate(key as string)}>
      {tabs.map((tab) => (
        <BottomNavigation.Item
          key={tab.key}
          label={tab.label}
          icon={getIcon(tab)}
        />
      ))}
    </BottomNavigation>
  );
};

export default BottomNav;
