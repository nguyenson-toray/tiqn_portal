import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { Box, Icon, Page, Spinner, Text } from "zmp-ui";
import { openChat } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import type { PayslipData, PayslipRow, PayslipSection, PayslipLine } from "@/api/types";
import { chatAtom, isReadOnlyAtom } from "@/store/auth";
import { viewedPayslipPeriodsAtom } from "@/store/data";
import { useAsyncAction } from "@/hooks/useApi";
import { getCachedPayslip, setCachedPayslip, removeCachedPayslip } from "@/utils/payslipCache";
import { formatCurrency, formatCurrencyRaw, formatDecimal, formatByUnit, formatDateShort } from "@/utils/format";
import ErrorState from "@/components/ErrorState";
import AppHeader from "@/components/AppHeader";
import PullToRefresh from "@/components/PullToRefresh";

/** Client-side filter: hide non-header rows where both amount and quantity are 0/null */
function filterZeroRows(rows: PayslipRow[]): PayslipRow[] {
  return rows.filter((row) => {
    if (row.is_header) return true;
    const amtZero = row.amount == null || row.amount === 0;
    const qtyZero = row.quantity == null || row.quantity === 0;
    return !(amtZero && qtyZero);
  });
}

interface LocationState {
  published_on?: string;
}

const PayslipDetailPage: React.FC = () => {
  const { period } = useParams<{ period: string }>();
  const location = useLocation();
  const publishedOn = (location.state as LocationState)?.published_on || "";
  const chat = useAtomValue(chatAtom);
  const isReadOnly = useAtomValue(isReadOnlyAtom);

  const [viewedPeriods, setViewedPeriods] = useAtom(viewedPayslipPeriodsAtom);

  const [hideZero, setHideZero] = useState(false);
  const [data, setData] = useState<PayslipData | null>(null);
  const fetchedRef = useRef(false);

  const { run: loadPayslip, loading, error } = useAsyncAction(
    useCallback(
      (p: string) => api.getPayslip(p, 1),
      [],
    ),
  );

  const fetchData = useCallback(() => {
    if (!period || loading) return;
    loadPayslip(period).then((result) => {
      if (result) {
        setData(result);
        setViewedPeriods((prev) => new Set(prev).add(period));
        // Persist to cache
        const pubOn = result.published_on || publishedOn;
        if (pubOn) {
          setCachedPayslip(period, pubOn, result);
        }
      }
    });
  }, [period, publishedOn, loadPayslip, setViewedPeriods]);

  // On mount: check persistent cache, then fetch if needed
  useEffect(() => {
    if (fetchedRef.current || !period) return;
    fetchedRef.current = true;

    if (publishedOn) {
      const cached = getCachedPayslip(period, publishedOn);
      if (cached) {
        setData(cached);
        setViewedPeriods((prev) => new Set(prev).add(period));
        return;
      }
    }

    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    if (!period) return;
    // Clear cache for this period, then re-fetch
    await removeCachedPayslip(period);
    const result = await loadPayslip(period);
    if (result) {
      setData(result);
      const pubOn = result.published_on || publishedOn;
      if (pubOn) {
        setCachedPayslip(period, pubOn, result);
      }
    }
  }, [period, publishedOn, loadPayslip]);

  const handleToggleZero = () => {
    setHideZero((prev) => !prev);
  };

  const handleChat = () => {
    if (chat) {
      openChat({ type: chat.type, id: chat.id });
    }
  };

  const chatEnabled = !!chat && !isReadOnly;
  const periodMonth = period ? period.split("-")[1] : "";
  const headerTitle = data
    ? `Lương T${periodMonth}: ${formatDateShort(data.period_from)} – ${formatDateShort(data.period_to)}`
    : period ? `Lương T${periodMonth}` : "Phiếu lương";
  const hasRows = data?.rows && data.rows.length > 0;

  // Apply client-side zero filtering
  const displayRows = hasRows
    ? (hideZero ? filterZeroRows(data!.rows!) : data!.rows!)
    : null;

  return (
    <Page className="flex flex-col h-full bg-gray-50">
      <AppHeader title={headerTitle} showBack />

      {loading && !data && (
        <Box className="flex items-center justify-center py-16">
          <Spinner />
        </Box>
      )}

      {error && !data && (
        <ErrorState message={error} onRetry={fetchData} />
      )}

      {/* Chat with payroll staff */}
      {chatEnabled && (
        <button
          type="button"
          className="w-full px-4 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2 active:bg-gray-50"
          onClick={handleChat}
        >
          <Icon icon="zi-chat" size={20} className="text-[#006AF5]" />
          <Box className="flex-1 text-left">
            <Text size="small" className="font-medium text-[#006AF5]">
              Chat với nhân viên phụ trách công, lương
            </Text>
            {chat.type === "user" && chat.name && (
              <Text size="xxSmall" className="text-gray-400">
                {chat.name}
              </Text>
            )}
          </Box>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {data && (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 pb-4">
          {/* Net pay + toggle */}
          <Box className="mx-4 mt-3 bg-[#006AF5] rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Text size="xSmall" className="text-blue-100 flex-shrink-0">Thực lĩnh</Text>
            <Text className="font-bold text-lg text-white flex-1 text-right">
              {formatCurrency(data.net_pay)}
            </Text>
            <button
              type="button"
              className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                hideZero
                  ? "bg-white/25 text-white"
                  : "bg-white/15 text-blue-100"
              }`}
              onClick={handleToggleZero}
            >
              {hideZero ? "Hiện 0đ" : "Ẩn 0đ"}
            </button>
          </Box>

          {/* Rows table (1.3.0+) or fallback to sections */}
          {displayRows ? (
            <PayslipTable rows={displayRows} />
          ) : (
            <Box className="px-4 mt-3 space-y-2">
              {data.sections.map((section) => (
                <CompactSection key={section.key} section={section} />
              ))}
            </Box>
          )}
        </PullToRefresh>
      )}
    </Page>
  );
};

// ========================
// Rows-based table (1.3.0)
// ========================

function formatQuantity(qty: number | null, unit: "DAY" | "HOUR" | null): string | null {
  if (qty == null || unit == null) return null;
  if (qty === 0) return "–";
  const formatted = formatDecimal(qty);
  return unit === "DAY" ? `${formatted} ngày` : `${formatted} giờ`;
}

function formatAmount(amount: number | null): string {
  if (amount == null) return "";
  if (amount === 0) return "–";
  return formatCurrencyRaw(amount);
}

const PayslipTable: React.FC<{ rows: PayslipRow[] }> = ({ rows }) => {
  // If any row has display_label, use new layout (no separate STT column)
  const useDisplayLabel = rows.some((r) => r.display_label);

  return (
    <Box className="mx-4 mt-3 bg-white rounded-lg border border-gray-100 overflow-hidden">
      {/* Sticky header */}
      <div className="flex items-center px-2 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        {!useDisplayLabel && (
          <span className="w-9 text-[10px] font-semibold text-gray-500 uppercase flex-shrink-0">STT</span>
        )}
        <span className="flex-1 text-[10px] font-semibold text-gray-500 uppercase">Nội dung</span>
        <span className="w-24 text-[10px] font-semibold text-gray-500 uppercase text-right flex-shrink-0">Số tiền</span>
      </div>

      {/* Data rows */}
      {rows.map((row, idx) => (
        <PayslipTableRow key={`${row.no}-${idx}`} row={row} useDisplayLabel={useDisplayLabel} />
      ))}
    </Box>
  );
};

const PayslipTableRow: React.FC<{ row: PayslipRow; useDisplayLabel: boolean }> = ({ row, useDisplayLabel }) => {
  const isNetPay = row.no === "9";
  const qty = formatQuantity(row.quantity, row.quantity_unit);
  const amt = formatAmount(row.amount);

  // Prefer display_label; fallback to legacy no + label + formula
  const labelText = row.display_label
    || (row.formula ? `${row.label} (${row.formula})` : row.label);

  if (isNetPay) {
    return (
      <div className="flex items-baseline px-2 py-2.5 bg-blue-50 border-t-2 border-[#006AF5]">
        {!useDisplayLabel && (
          <span className="w-9 text-xs font-bold text-[#006AF5] flex-shrink-0 tabular-nums">{row.no}</span>
        )}
        <span className="flex-1 text-xs font-bold text-[#006AF5] min-w-0 break-words">
          {labelText}
        </span>
        <span className="w-24 text-xs font-bold text-[#006AF5] text-right flex-shrink-0 tabular-nums whitespace-nowrap">
          {amt}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-baseline px-2 py-1.5 ${
        row.is_header ? "bg-gray-50 border-t border-gray-100" : ""
      }`}
    >
      {!useDisplayLabel && (
        <span
          className={`w-9 text-[11px] flex-shrink-0 tabular-nums ${
            row.is_header ? "font-semibold text-gray-800" : "text-gray-400"
          }`}
        >
          {row.no}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`text-[11px] break-words ${
            row.is_header ? "font-semibold text-gray-800" : "text-gray-600"
          } ${row.level === 1 ? "pl-4" : ""}`}
        >
          {labelText}
        </span>
        {qty && (
          <span className="text-[10px] text-gray-400 ml-1.5">
            · {qty}
          </span>
        )}
      </div>
      <span
        className={`w-24 text-[11px] text-right flex-shrink-0 tabular-nums whitespace-nowrap ${
          row.is_header ? "font-semibold text-gray-800" : "text-gray-700"
        }`}
      >
        {amt}
      </span>
    </div>
  );
};

// ============================
// Fallback: sections (< 1.3.0)
// ============================

const CompactSection: React.FC<{ section: PayslipSection }> = ({ section }) => {
  if (section.lines.length === 0) return null;

  const formatTotal = () => {
    if (section.total == null) return "";
    const prefix = section.sign === -1 ? "−" : "";
    if (section.unit === "VND") return `${prefix}${formatCurrency(section.total)}`;
    return `${prefix}${section.total}`;
  };

  return (
    <Box className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <Box className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <Text size="xxSmall" className="font-semibold text-gray-700 uppercase tracking-wide">
          {section.label}
        </Text>
        {section.total != null && (
          <Text size="xSmall" className="font-bold text-gray-800">
            {formatTotal()}
          </Text>
        )}
      </Box>
      {section.lines.map((line, idx) => (
        <CompactLine key={`${line.code}-${idx}`} line={line} sectionSign={section.sign} depth={0} />
      ))}
    </Box>
  );
};

const CompactLine: React.FC<{ line: PayslipLine; sectionSign: -1 | 0 | 1; depth: number }> = ({
  line,
  sectionSign,
  depth,
}) => {
  const formattedAmount = formatByUnit(line.amount, line.unit);
  const displayAmount = sectionSign === -1 && line.amount > 0 ? `−${formattedAmount}` : formattedAmount;

  return (
    <>
      <Box
        className={`flex items-center justify-between px-3 py-1.5 ${
          depth > 0 ? "pl-6" : ""
        } ${line.is_total ? "bg-gray-50 border-t border-gray-100" : ""}`}
      >
        <Text
          size="xxSmall"
          className={`flex-1 mr-2 ${
            line.is_total ? "font-semibold text-gray-800" : "text-gray-600"
          } ${depth > 0 ? "text-gray-500" : ""}`}
        >
          {line.label}
        </Text>
        <Text
          size="xxSmall"
          className={`whitespace-nowrap ${
            line.is_total ? "font-semibold text-gray-800" : "text-gray-700"
          }`}
        >
          {displayAmount}
        </Text>
      </Box>
      {line.children.map((child, idx) => (
        <CompactLine
          key={`${child.code}-${idx}`}
          line={child}
          sectionSign={sectionSign}
          depth={depth + 1}
        />
      ))}
    </>
  );
};

export default PayslipDetailPage;
