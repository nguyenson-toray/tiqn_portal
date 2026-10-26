import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Button, Icon } from "zmp-ui";
import { followOA, openWebview, openChat } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import {
  configAtom,
  employeeAtom,
  oaAtom,
  chatAtom,
  maskedPhoneAtom,
  isReadOnlyAtom,
} from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";
import EmployeeAvatar from "@/components/EmployeeAvatar";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";

const APP_VERSION = "1.0.0";

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const employee = useAtomValue(employeeAtom);
  const oa = useAtomValue(oaAtom);
  const chat = useAtomValue(chatAtom);
  const maskedPhone = useAtomValue(maskedPhoneAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);
  const { clearSession } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [followingOA, setFollowingOA] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    await clearSession();
    navigate("/login", { replace: true });
  };

  const handleFollowOA = async () => {
    if (!config?.oa.oa_id) return;
    setFollowingOA(true);
    try {
      await followOA({ id: config.oa.oa_id });
      try {
        await api.setOAFollow("FOLLOWED");
      } catch {
        // Ignore sync error
      }
    } catch {
      // User cancelled or error
    }
    setFollowingOA(false);
  };

  const handleContactChat = () => {
    if (!chat || isReadOnly) return;
    openChat({ type: chat.type, id: chat.id });
  };

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Tài khoản" />

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-20 space-y-3">
        {/* Employee Card */}
        {employee && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Box className="flex items-center gap-3">
              <EmployeeAvatar
                initials={employee.initials}
                avatarUrl={employee.avatar_url}
                size={56}
              />
              <Box className="flex-1 min-w-0">
                <Text className="font-bold text-lg text-gray-900 truncate leading-tight">
                  {employee.full_name}
                </Text>
                <Text size="xSmall" className="text-gray-500 truncate leading-tight mt-0.5">
                  {employee.section}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Info Card */}
        <Box className="bg-white rounded-xl shadow-sm overflow-hidden">
          <InfoRow label="Mã nhân viên" value={employee?.employee_id || ""} />
          <InfoRow label="Chức vụ" value={employee ? `${employee.designation}${employee.group ? ` · ${employee.group}` : ""}` : ""} />
          <InfoRow label="SĐT đăng nhập" value={maskedPhone || ""} />
        </Box>

        {/* OA Card */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Box className="flex items-center justify-between">
            <Box>
              <Text size="small" className="text-gray-500">
                OA công ty
              </Text>
              <Text size="small" className="font-medium text-gray-900 mt-0.5">
                {oa.followed ? "Đã quan tâm" : "Chưa quan tâm"}
              </Text>
            </Box>
            {!oa.followed && (
              <Button
                variant="secondary"
                size="small"
                loading={followingOA}
                disabled={followingOA}
                onClick={handleFollowOA}
              >
                Quan tâm
              </Button>
            )}
          </Box>
        </Box>

        {/* Links Card */}
        <Box className="bg-white rounded-xl shadow-sm overflow-hidden">
          <LinkRow
            label="Chính sách dữ liệu"
            onClick={() => {
              if (config?.legal.privacy_policy_url) {
                openWebview({ url: config.legal.privacy_policy_url });
              }
            }}
          />
          <LinkRow
            label="Điều khoản sử dụng"
            onClick={() => {
              if (config?.legal.terms_url) {
                openWebview({ url: config.legal.terms_url });
              }
            }}
          />
        </Box>

        {/* Contact Card */}
        {config?.contacts.company_phone && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Box className="flex items-center justify-between">
              <Box>
                <Text size="small" className="text-gray-500">
                  Liên hệ công ty
                </Text>
                <Text size="small" className="font-medium text-gray-900 mt-0.5">
                  {config.contacts.company_phone}
                </Text>
              </Box>
              {chat && !isReadOnly && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleContactChat}
                  prefixIcon={<Icon icon="zi-chat" size={16} />}
                >
                  Nhắn tin
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Footer info */}
        <Box className="pt-1 pb-2 space-y-2">
          <Text size="xSmall" className="text-gray-400 text-center">
            Phiên bản {APP_VERSION}
          </Text>
          <Text size="xSmall" className="text-gray-400 text-center px-2">
            Ứng dụng được phát triển bởi nhóm IT - TIQN
          </Text>
          <Text size="xSmall" className="text-gray-400 text-center px-2">
            Sai thông tin hồ sơ? Liên hệ phòng Nhân sự để cập nhật trên hệ thống.
          </Text>
        </Box>

        {/* Logout */}
        <Box>
          <Button
            className="w-full"
            variant="secondary"
            size="large"
            loading={loggingOut}
            disabled={loggingOut}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      <BottomNav />
    </Page>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <Box className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-b-0">
    <Text size="small" className="text-gray-500">
      {label}
    </Text>
    <Text size="small" className="font-medium text-gray-900">
      {value}
    </Text>
  </Box>
);

interface LinkRowProps {
  label: string;
  onClick: () => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ label, onClick }) => (
  <button
    type="button"
    className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-b-0 active:bg-gray-50"
    onClick={onClick}
  >
    <Text size="small" className="text-gray-900">
      {label}
    </Text>
    <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
  </button>
);

export default AccountPage;
