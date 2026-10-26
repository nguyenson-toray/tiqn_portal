import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Button, Icon } from "zmp-ui";
import { followOA } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { configAtom } from "@/store/auth";

const OAInvitePage: React.FC = () => {
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oaId = config?.oa.oa_id || "";
  const companyName = config?.company.name || "";
  const features = config?.features;

  // Build benefit list based on enabled features
  const benefits: string[] = [];
  if (features?.leave_view || features?.leave_create || features?.explanation_create) {
    benefits.push("Nhận thông báo khi đơn nghỉ phép, giải trình được duyệt hoặc từ chối");
  }
  if (features?.payslip) {
    benefits.push("Nhận thông báo khi phiếu lương mới được phát hành");
  }
  if (benefits.length === 0) {
    benefits.push("Nhận thông báo từ công ty qua Zalo");
  }

  const handleDismiss = async () => {
    try {
      await api.setOAFollow("DISMISSED");
    } catch {
      // Ignore errors on dismiss
    }
    navigate("/home", { replace: true });
  };

  const handleFollow = async () => {
    setLoading(true);
    setError(null);
    try {
      await followOA({ id: oaId });
      try {
        await api.setOAFollow("FOLLOWED");
      } catch {
        // Ignore server sync error
      }
      navigate("/home", { replace: true });
    } catch {
      setError("Kh\u00f4ng th\u1ec3 quan t\u00e2m OA. B\u1ea1n c\u00f3 th\u1ec3 th\u1eed l\u1ea1i trong m\u1ee5c T\u00e0i kho\u1ea3n.");
      setLoading(false);
    }
  };

  return (
    <Page className="flex flex-col bg-white" hideScrollbar={false}>
      <Box className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Box className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Icon icon="zi-chat" size={40} className="text-[#006AF5]" />
        </Box>

        <Text.Title size="large" className="text-center mb-2">
          {"Nh\u1eadn th\u00f4ng b\u00e1o qua Zalo"}
        </Text.Title>

        <Text className="text-center text-gray-600 mb-6">
          {"Quan t\u00e2m "}
          <Text className="font-semibold" style={{ display: "inline" }}>{companyName}</Text>
        </Text>

        <Box className="w-full bg-blue-50 rounded-xl p-4 mb-6 space-y-3">
          {benefits.map((text, idx) => (
            <Box key={idx} className="flex items-start gap-2">
              <Icon icon="zi-check-circle-solid" size={18} className="text-[#006AF5] mt-0.5 flex-shrink-0" />
              <Text size="small" className="text-gray-700">{text}</Text>
            </Box>
          ))}
        </Box>

        <Text size="xSmall" className="text-gray-400 text-center mb-8 px-2">
          {"Kh\u00f4ng b\u1eaft bu\u1ed9c \u2013 b\u1ea1n v\u1eabn d\u00f9ng \u0111\u1ea7y \u0111\u1ee7 t\u00ednh n\u0103ng. C\u00f3 th\u1ec3 quan t\u00e2m sau trong m\u1ee5c T\u00e0i kho\u1ea3n."}
        </Text>

        {error && (
          <Box className="w-full mb-4 p-3 rounded-lg bg-red-50">
            <Text size="small" className="text-red-600 text-center">
              {error}
            </Text>
          </Box>
        )}

        <Box className="w-full space-y-3">
          <Button
            className="w-full"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            onClick={handleFollow}
          >
            {"Quan t\u00e2m"}
          </Button>
          <Button
            className="w-full"
            variant="tertiary"
            size="large"
            disabled={loading}
            onClick={handleDismiss}
          >
            {"\u0110\u1ec3 sau"}
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default OAInvitePage;
