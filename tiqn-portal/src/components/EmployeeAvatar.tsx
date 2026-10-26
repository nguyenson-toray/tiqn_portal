import React, { useState } from "react";
import { useAtomValue } from "jotai";
import { zaloAvatarAtom } from "@/store/auth";

interface EmployeeAvatarProps {
  initials: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  initials,
  avatarUrl,
  size = 48,
  className,
}) => {
  const zaloAvatar = useAtomValue(zaloAvatarAtom);
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Fallback chain: backend avatar → Zalo avatar → initials
  const primarySrc = avatarUrl && !primaryError ? avatarUrl : null;
  const fallbackSrc = !primarySrc && zaloAvatar && !fallbackError ? zaloAvatar : null;
  const imgSrc = primarySrc || fallbackSrc;

  const ring = size >= 48;
  const ringSize = ring ? size + 4 : size;

  const inner = imgSrc ? (
    <img
      src={imgSrc}
      alt={initials}
      onError={() => {
        if (primarySrc) setPrimaryError(true);
        else setFallbackError(true);
      }}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-gradient-to-br from-[#006AF5] to-[#0050C8] text-white flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );

  if (!ring) return <span className={className || ""}>{inner}</span>;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#006AF5] via-[#3b82f6] to-[#60a5fa] ${className || ""}`}
      style={{ width: ringSize, height: ringSize, padding: 2 }}
    >
      <span className="rounded-full bg-white flex items-center justify-center" style={{ width: size, height: size, padding: 1 }}>
        {inner}
      </span>
    </span>
  );
};

export default EmployeeAvatar;
