import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text } from "zmp-ui";
import logo from "@/images/logo.png";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Unified app header.
 * Row 1: App name "Cổng nhân viên" — sits at Zalo controls level (... and X)
 * Row 2: Page title / custom content — below Zalo controls, fully visible
 */
const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack, rightContent, children }) => {
  const navigate = useNavigate();

  return (
    <Box
      className="bg-gradient-to-r from-[#006AF5] to-[#0050C8]"
      style={{ paddingTop: "var(--zaui-safe-area-inset-top, 0px)" }}
    >
      {/* Row 1: Logo + app name — same level as Zalo native controls */}
      <Box className="px-4 pt-1.5 pb-1 flex items-center gap-2">
        <img src={logo} alt="TORAY" className="h-4 brightness-0 invert" />
        <Text size="large" className="text-white font-semibold tracking-wide">
          Cổng thông tin nhân viên
        </Text>
      </Box>

      {/* Row 2: Page content — below Zalo controls */}
      {children ? (
        <Box className="px-4 pb-3">{children}</Box>
      ) : (
        <Box className="px-4 pb-3 flex items-center gap-3">
          {showBack && (
            <button type="button" className="p-1 -ml-1" aria-label="Quay lại" onClick={() => navigate(-1)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <Text className="font-semibold text-lg text-white flex-1">{title}</Text>
          {rightContent}
        </Box>
      )}
    </Box>
  );
};

export default AppHeader;
