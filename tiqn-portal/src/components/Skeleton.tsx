import React from "react";
import { Box } from "zmp-ui";

interface SkeletonProps {
  className?: string;
}

/** Single skeleton block with shimmer animation */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`skeleton ${className}`} />
);

/** Home page skeleton */
export const HomeSkeleton: React.FC = () => (
  <Box className="px-4 pt-3 pb-20 space-y-3">
    {/* Employee card */}
    <Box className="bg-white rounded-2xl p-4 shadow-sm">
      <Box className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 !rounded-full flex-shrink-0" />
        <Box className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3.5 w-48" />
        </Box>
      </Box>
    </Box>

    {/* Payslip card */}
    <Box className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-28" />
    </Box>

    {/* Today card */}
    <Box className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-5 w-24" />
      <Box className="flex gap-6">
        <Box className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-16" />
        </Box>
        <Box className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-16" />
        </Box>
      </Box>
    </Box>

    {/* Stats grid */}
    <Box className="grid grid-cols-2 gap-3">
      <Box className="bg-white rounded-2xl p-3 shadow-sm space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16" />
      </Box>
      <Box className="bg-white rounded-2xl p-3 shadow-sm space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-20" />
      </Box>
    </Box>
  </Box>
);

/** Payslip list skeleton */
export const PayslipListSkeleton: React.FC = () => (
  <Box className="px-4 pt-3 space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <Box key={i} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <Box className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16 !rounded-full" />
        </Box>
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-28" />
      </Box>
    ))}
  </Box>
);

/** Payslip detail skeleton */
export const PayslipDetailSkeleton: React.FC = () => (
  <Box className="px-4 pt-3 space-y-3">
    {/* Net pay */}
    <Skeleton className="h-14 w-full !rounded-xl" />
    {/* Table */}
    <Box className="bg-white rounded-lg overflow-hidden space-y-0">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Box key={i} className="px-3 py-2.5 flex items-center justify-between border-b border-gray-50">
          <Skeleton className={`h-3.5 ${i % 3 === 1 ? "w-40" : "w-28"}`} />
          <Skeleton className="h-3.5 w-20" />
        </Box>
      ))}
    </Box>
  </Box>
);

export default Skeleton;
