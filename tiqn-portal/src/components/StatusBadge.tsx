import React from "react";

interface StatusBadgeProps {
  status: string;
  label: string;
}

const colorMap: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  REGISTERED: "bg-blue-100 text-blue-700",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || "bg-gray-100 text-gray-600"}`}>
    {label}
  </span>
);

export default StatusBadge;
