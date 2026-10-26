import React from "react";
import { Box, Text } from "zmp-ui";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Không có dữ liệu",
  icon,
}) => (
  <Box className="flex flex-col items-center justify-center py-16 px-6">
    {icon || (
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      </div>
    )}
    <Text className="text-center text-gray-500">{message}</Text>
  </Box>
);

export default EmptyState;
