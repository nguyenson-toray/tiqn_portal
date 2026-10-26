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

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={initials}
        onError={() => {
          if (primarySrc) setPrimaryError(true);
          else setFallbackError(true);
        }}
        className={`rounded-full object-cover ${className || ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#006AF5] text-white flex items-center justify-center font-bold ${className || ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
};

export default EmployeeAvatar;
