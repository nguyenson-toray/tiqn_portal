import React from "react";
import { Box, Text, Button } from "zmp-ui";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Có lỗi, vui lòng thử lại",
  onRetry,
}) => (
  <Box className="flex flex-col items-center justify-center py-16 px-6">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <Text className="text-center text-gray-600 mb-4">{message}</Text>
    {onRetry && (
      <Button size="small" onClick={onRetry}>
        Thử lại
      </Button>
    )}
  </Box>
);

export default ErrorState;
