import React from "react";
import { useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Button } from "zmp-ui";

import { configAtom } from "@/store/auth";
import { formatDate } from "@/utils/format";

const DeactivatedPage: React.FC = () => {
  const location = useLocation();
  const config = useAtomValue(configAtom);
  const companyPhone = config?.contacts.company_phone;

  const state = (location.state as any) || {};
  const expiredOn: string | undefined = state.expired_on;
  const message: string | undefined = state.message;

  return (
    <Page className="flex flex-col bg-white">
      <Box className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <Box className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </Box>

        {/* Title */}
        <Text.Title size="large" className="mb-4 text-center">
          Tài khoản đã ngừng hoạt động
        </Text.Title>

        {/* Reason */}
        <Box className="space-y-3 mb-8">
          {expiredOn && (
            <Box className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 text-center">
                Thời gian sử dụng sau nghỉ việc của bạn đã kết thúc ngày{" "}
                <span className="font-medium text-gray-800">
                  {formatDate(expiredOn)}
                </span>
              </Text>
            </Box>
          )}

          {message && (
            <Box className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 text-center">
                {message}
              </Text>
            </Box>
          )}

          {!expiredOn && !message && (
            <Text className="text-sm text-gray-600 text-center">
              Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ công ty để biết thêm chi tiết.
            </Text>
          )}
        </Box>

        {/* Action */}
        {companyPhone && (
          <Box className="w-full">
            <Button
              className="w-full"
              variant="primary"
              size="large"
              onClick={() => {
                window.location.href = `tel:${companyPhone}`;
              }}
            >
              Gọi công ty ({companyPhone})
            </Button>
          </Box>
        )}
      </Box>
    </Page>
  );
};

export default DeactivatedPage;
