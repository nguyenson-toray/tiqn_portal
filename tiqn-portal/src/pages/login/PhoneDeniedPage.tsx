import React from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Button } from "zmp-ui";
import { openWebview } from "zmp-sdk/apis";

import { configAtom } from "@/store/auth";

const PhoneDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const hrHotline = config?.contacts.hr_hotline;

  return (
    <Page className="flex flex-col bg-white">
      <Box className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <Box className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </Box>

        {/* Title */}
        <Text.Title size="large" className="mb-3 text-center">
          Cần số điện thoại để đăng nhập
        </Text.Title>

        {/* Explanation */}
        <Box className="space-y-3 mb-8">
          <Text className="text-sm text-gray-600 text-center">
            Ứng dụng cần xác minh số điện thoại Zalo của bạn để tìm hồ sơ nhân viên tương ứng trong hệ thống công ty.
          </Text>

          <Box className="bg-gray-50 rounded-xl p-4 space-y-2">
            <Box className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <Text className="text-sm text-gray-700">
                Chỉ dùng để đối chiếu hồ sơ nhân viên
              </Text>
            </Box>
            <Box className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <Text className="text-sm text-gray-700">
                Không chia sẻ cho bên thứ ba, không quảng cáo
              </Text>
            </Box>
          </Box>

          {config?.legal.privacy_policy_url && (
            <Text
              className="text-sm text-[#006AF5] text-center underline"
              onClick={() => openWebview({ url: config.legal.privacy_policy_url })}
            >
              Xem chính sách bảo mật
            </Text>
          )}
        </Box>

        {/* Actions */}
        <Box className="w-full space-y-3">
          <Button
            className="w-full"
            variant="primary"
            size="large"
            onClick={() => navigate("/login", { replace: true })}
          >
            Thử lại
          </Button>

          {hrHotline && (
            <Button
              className="w-full"
              variant="tertiary"
              size="large"
              onClick={() => {
                window.location.href = `tel:${hrHotline}`;
              }}
            >
              Gọi phòng Nhân sự ({hrHotline})
            </Button>
          )}
        </Box>
      </Box>
    </Page>
  );
};

export default PhoneDeniedPage;
