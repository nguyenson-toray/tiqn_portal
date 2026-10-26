import React from "react";
import { Page, Box, Text } from "zmp-ui";

const UpdateRequiredPage: React.FC = () => {
  return (
    <Page className="flex flex-col bg-white">
      <Box className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <Box className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#006AF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </Box>

        {/* Message */}
        <Text.Title size="large" className="mb-3 text-center">
          Cần cập nhật ứng dụng
        </Text.Title>
        <Text className="text-sm text-gray-600 text-center">
          Vui lòng cập nhật ứng dụng để tiếp tục sử dụng
        </Text>
      </Box>
    </Page>
  );
};

export default UpdateRequiredPage;
