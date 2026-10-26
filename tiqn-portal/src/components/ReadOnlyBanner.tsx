import React from "react";
import { Box, Text } from "zmp-ui";
import { useAtomValue } from "jotai";
import { accessAtom, isReadOnlyAtom } from "@/store/auth";
import { formatDate } from "@/utils/format";

const ReadOnlyBanner: React.FC = () => {
  const isReadOnly = useAtomValue(isReadOnlyAtom);
  const access = useAtomValue(accessAtom);

  if (!isReadOnly) return null;

  return (
    <Box className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <Text size="small" className="text-amber-700">
        Chế độ chỉ xem{access?.read_only_until ? ` đến ${formatDate(access.read_only_until)}` : ""}
      </Text>
    </Box>
  );
};

export default ReadOnlyBanner;
