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

      <Box className="flex-1 overflow-auto pb-20">
        {employee && (
          <Box className="bg-white px-4 py-5 flex items-center gap-4 border-b border-gray-100">
            <EmployeeAvatar
              initials={employee.initials}
              avatarUrl={employee.avatar_url}
              size={56}
            />
            <Box className="flex-1 min-w-0">
              <Text className="font-semibold text-lg text-gray-900 truncate">
                {employee.full_name}
              </Text>
              <Text size="small" className="text-gray-500 truncate">
                {employee.designation}
              </Text>
            </Box>
          </Box>
        )}

        <Box className="bg-white mt-2 border-y border-gray-100">
          <InfoRow label={"M\u00e3 nh\u00e2n vi\u00ean"} value={employee?.employee_id || ""} />
          <InfoRow label={"Ch\u1ee9c v\u1ee5"} value={employee ? `${employee.designation}${employee.group ? ` · ${employee.group}` : ""}` : ""} />
          <InfoRow label={"S\u0110T \u0111\u0103ng nh\u1eadp"} value={maskedPhone || ""} />
        </Box>

        <Box className="bg-white mt-2 border-y border-gray-100 px-4 py-3">
          <Box className="flex items-center justify-between">
            <Box>
              <Text size="small" className="text-gray-500">
                Tài khoản OA - Trang Zalo chính thức của công ty
              </Text>
              <Text size="small" className="font-medium text-gray-900 mt-0.5">
                {oa.followed ? "\u0110\u00e3 quan t\u00e2m" : "Ch\u01b0a quan t\u00e2m"}
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
                {"Quan t\u00e2m"}
              </Button>
            )}
          </Box>
        </Box>

        <Box className="bg-white mt-2 border-y border-gray-100">
          <LinkRow
            label={"Ch\u00ednh s\u00e1ch d\u1eef li\u1ec7u"}
            onClick={() => {
              if (config?.legal.privacy_policy_url) {
                openWebview({ url: config.legal.privacy_policy_url });
              }
            }}
          />
          <LinkRow
            label={"\u0110i\u1ec1u kho\u1ea3n s\u1eed d\u1ee5ng"}
            onClick={() => {
              if (config?.legal.terms_url) {
                openWebview({ url: config.legal.terms_url });
              }
            }}
          />
        </Box>

        {config?.contacts.company_phone && (
          <Box className="bg-white mt-2 border-y border-gray-100">
            <Box className="px-4 py-3 flex items-center justify-between">
              <Box>
                <Text size="small" className="text-gray-500">
                  {"Li\u00ean h\u1ec7 c\u00f4ng ty"}
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

        <Box className="px-4 pt-4 pb-2">
          <Text size="xSmall" className="text-gray-400 text-center">
            {"Phi\u00ean b\u1ea3n "}{APP_VERSION}
          </Text>
        </Box>

        <Box className="px-6 pb-4">
          <Text size="xSmall" className="text-gray-400 text-center">
            {"Sai th\u00f4ng tin h\u1ed3 s\u01a1? Li\u00ean h\u1ec7 ph\u00f2ng Nh\u00e2n s\u1ef1 \u0111\u1ec3 c\u1eadp nh\u1eadt tr\u00ean h\u1ec7 th\u1ed1ng."}
          </Text>
        </Box>

        <Box className="px-4 pb-6">
          <Button
            className="w-full"
            variant="secondary"
            size="large"
            loading={loggingOut}
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {"\u0110\u0103ng xu\u1ea5t"}
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
    className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-b-0 bg-white"
    onClick={onClick}
  >
    <Text size="small" className="text-gray-900">
      {label}
    </Text>
    <Icon icon="zi-chevron-right" size={16} className="text-gray-400" />
  </button>
);

export default AccountPage;
