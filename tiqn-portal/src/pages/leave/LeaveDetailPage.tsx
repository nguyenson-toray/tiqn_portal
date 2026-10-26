import React, { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Page, Box, Text, Spinner, Button, Icon, Modal } from "zmp-ui";

import * as api from "@/api/endpoints";
import type { LeaveApplicationDetail } from "@/api/types";
import { useAsyncAction } from "@/hooks/useApi";
import { configAtom, isReadOnlyAtom } from "@/store/auth";
import { formatDateShort, formatDate, formatDateTime, formatDecimal } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import StatusBadge from "@/components/StatusBadge";
import AppHeader from "@/components/AppHeader";

function formatDateRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

const LeaveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const config = useAtomValue(configAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [detail, setDetail] = useState<LeaveApplicationDetail | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const { run: fetchDetail, loading, error } = useAsyncAction(api.getLeaveApplication);
  const { run: runCancel, loading: cancelling } = useAsyncAction(api.cancelLeaveApplication);
  const { run: runDeleteDoc, loading: deletingDoc } = useAsyncAction(api.deleteLeaveDocument);
  const { run: runUploadDoc } = useAsyncAction(api.uploadLeaveDocument);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await fetchDetail(id);
    if (data && mountedRef.current) setDetail(data);
  }, [id, fetchDetail]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const handleCancel = async () => {
    if (!id) return;
    const result = await runCancel(id);
    if (result && mountedRef.current) {
      setDetail(result);
      setCancelModalVisible(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;
    const result = await runDeleteDoc(deleteDocId);
    if (result !== null && mountedRef.current) {
      // Refresh detail to get updated documents
      loadData();
      setDeleteDocId(null);
    }
  };

  const handleUploadMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || !id) return;

    const uploadsConfig = config?.uploads;
    const maxSizeMB = uploadsConfig?.max_size_mb ?? 5;
    const acceptTypes = uploadsConfig?.accept ?? [];

    for (const file of Array.from(selected)) {
      // Client-side validation
      if (file.size > maxSizeMB * 1024 * 1024) {
        continue;
      }
      if (acceptTypes.length > 0) {
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const mimeMatch = acceptTypes.some(
          (a) => file.type === a || (a.endsWith("/*") && file.type.startsWith(a.replace("/*", "/")))
        );
        const extMatch = acceptTypes.some((a) => a.startsWith(".") && ext === a.toLowerCase());
        if (!mimeMatch && !extMatch) continue;
      }

      const uploadId = crypto.randomUUID();
      await runUploadDoc(id, uploadId, file);
    }

    // Refresh to show new documents
    loadData();
    e.target.value = "";
  };

  if (loading && !detail) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Chi tiết đơn nghỉ" showBack />
        <Box className="flex-1 flex items-center justify-center">
          <Spinner visible />
        </Box>
      </Page>
    );
  }

  if (error && !detail) {
    return (
      <Page className="flex flex-col bg-gray-50">
        <AppHeader title="Chi tiết đơn nghỉ" showBack />
        <ErrorState message={error} onRetry={loadData} />
      </Page>
    );
  }

  if (!detail) return null;

  return (
    <Page className="flex flex-col bg-gray-50" hideScrollbar={false}>
      <AppHeader title="Chi tiết đơn nghỉ" showBack />

      <Box className="flex-1 overflow-auto px-4 pt-3 pb-6 space-y-3">
        {/* Status & Meta */}
        <Box className="bg-white rounded-xl p-4 shadow-sm">
          <Box className="flex items-center justify-between mb-2">
            <StatusBadge status={detail.status} label={detail.status_label} />
          </Box>
          <Text size="xSmall" className="text-gray-400">
            Gửi lúc {formatDateTime(detail.created_at)} · {detail.id}
          </Text>
        </Box>

        {/* Needs documents alert */}
        {detail.needs_documents && detail.documents_request_note && (
          <Box className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <Box className="flex items-start gap-2">
              <Icon icon="zi-warning" size={18} className="text-orange-500 mt-0.5" />
              <Box>
                <Text size="small" className="font-medium text-orange-700 mb-0.5">
                  Cần bổ sung giấy tờ
                </Text>
                <Text size="xSmall" className="text-orange-600">
                  {detail.documents_request_note}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Approver note */}
        {detail.approver_note && (
          <Box className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <Text size="small" className="font-medium text-blue-700 mb-0.5">
              Ghi chú người duyệt
            </Text>
            <Text size="xSmall" className="text-[#006AF5]">
              {detail.approver_note}
            </Text>
          </Box>
        )}

        {/* Details */}
        <Box className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <DetailRow label="Loại nghỉ" value={detail.leave_type_label} />
          <DetailRow
            label="Thời gian"
            value={`${formatDateRange(detail.from_date, detail.to_date)}${detail.half_day ? " (nửa ngày)" : ""}`}
          />
          <DetailRow label="Số ngày" value={`${formatDecimal(detail.days)} ngày`} />
          <DetailRow label="Lý do" value={detail.reason} />
          {detail.approver && (
            <Box>
              <Text size="xxSmall" className="text-gray-400 mb-0.5">
                Người duyệt
              </Text>
              <Box className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <Text style={{ fontSize: 10 }} className="text-[#006AF5] font-semibold">
                    {detail.approver.initials}
                  </Text>
                </div>
                <Box>
                  <Text size="small" className="text-gray-900">
                    {detail.approver.full_name}
                  </Text>
                  <Text size="xxSmall" className="text-gray-500">
                    {detail.approver.designation}
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Timeline */}
        {detail.timeline.length > 0 && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="small" className="font-medium text-gray-900 mb-3">
              Tiến trình
            </Text>
            <Box className="space-y-0">
              {detail.timeline.map((evt, idx) => (
                <Box
                  key={`${evt.event}-${idx}`}
                  className={`flex gap-3 ${!evt.done ? "opacity-40" : ""}`}
                >
                  {/* Timeline dot and line */}
                  <Box className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                        evt.done ? "bg-[#006AF5]" : "bg-gray-300"
                      }`}
                    />
                    {idx < detail.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 my-1" />
                    )}
                  </Box>
                  <Box className="pb-3 min-w-0 flex-1">
                    <Text size="small" className="font-medium text-gray-900">
                      {evt.label}
                    </Text>
                    {evt.at && (
                      <Text size="xxSmall" className="text-gray-400">
                        {formatDateTime(evt.at)}
                        {evt.by ? ` · ${evt.by}` : ""}
                      </Text>
                    )}
                    {evt.note && (
                      <Text size="xxSmall" className="text-gray-500 mt-0.5">
                        {evt.note}
                      </Text>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Documents */}
        {(detail.documents.length > 0 || detail.can_add_documents) && (
          <Box className="bg-white rounded-xl p-4 shadow-sm">
            <Text size="small" className="font-medium text-gray-900 mb-3">
              Giấy tờ đính kèm
            </Text>

            {detail.documents.length > 0 && (
              <Box className="space-y-2 mb-3">
                {detail.documents.map((doc) => (
                  <Box
                    key={doc.id}
                    className="border border-gray-100 rounded-lg overflow-hidden"
                  >
                    {/* Image thumbnail */}
                    {isImageMime(doc.mime_type) && (
                      <img
                        src={doc.url}
                        alt={doc.file_name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <Box className="px-3 py-2 flex items-center justify-between">
                      <Box className="min-w-0 flex-1">
                        <Text size="xSmall" className="text-gray-700 truncate">
                          {doc.file_name}
                        </Text>
                        <Text size="xxSmall" className="text-gray-400">
                          {formatFileSize(doc.size_bytes)} ·{" "}
                          {formatDateShort(doc.uploaded_at.split(" ")[0])}
                        </Text>
                      </Box>
                      {doc.can_delete && !isReadOnly && (
                        <button
                          type="button"
                          className="p-1 text-red-400"
                          onClick={() => setDeleteDocId(doc.id)}
                        >
                          <Icon icon="zi-delete" size={18} />
                        </button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Upload more */}
            {detail.can_add_documents && !isReadOnly && (
              <>
                <Button
                  size="small"
                  variant="secondary"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                >
                  Bổ sung giấy tờ
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={config?.uploads?.accept?.join(",") || "image/*,.pdf"}
                  onChange={handleUploadMore}
                  className="hidden"
                />
              </>
            )}
          </Box>
        )}

        {/* Cancel Button */}
        {detail.can_cancel && !isReadOnly && (
          <Button
            fullWidth
            variant="secondary"
            className="!text-red-500 !border-red-200"
            onClick={() => setCancelModalVisible(true)}
          >
            Hủy đơn
          </Button>
        )}
      </Box>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        title="Xác nhận hủy đơn"
        description="Bạn có chắc chắn muốn hủy đơn nghỉ này? Thao tác này không thể hoàn tác."
        actions={[
          {
            text: "Không",
            close: true,
          },
          {
            text: "Hủy đơn",
            highLight: true,
            onClick: handleCancel,
          },
        ]}
      />

      {/* Delete Document Confirmation Modal */}
      <Modal
        visible={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        title="Xóa giấy tờ"
        description="Bạn có chắc chắn muốn xóa giấy tờ này?"
        actions={[
          {
            text: "Không",
            close: true,
          },
          {
            text: "Xóa",
            highLight: true,
            onClick: handleDeleteDoc,
          },
        ]}
      />
    </Page>
  );
};

// Helper component
const DetailRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Box>
    <Text size="xxSmall" className="text-gray-400 mb-0.5">
      {label}
    </Text>
    <Text size="small" className="text-gray-900">
      {value}
    </Text>
  </Box>
);

export default LeaveDetailPage;
