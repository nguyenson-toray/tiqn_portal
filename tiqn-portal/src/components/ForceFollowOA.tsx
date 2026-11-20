import { useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { followOA, getUserInfo } from "zmp-sdk/apis";

import * as api from "@/api/endpoints";
import { configAtom, oaAtom } from "@/store/auth";

/**
 * Global force-follow OA: triggers Zalo native dialog once per session
 * when server says force_follow=true and user hasn't followed yet.
 * Renders nothing — just runs the side effect.
 */
const ForceFollowOA: React.FC = () => {
  const config = useAtomValue(configAtom);
  const [oa, setOa] = useAtom(oaAtom);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!oa?.force_follow || oa.followed) return;
    const oaId = oa.oa_id || config?.oa.oa_id;
    if (!oaId) return;

    const delay = (oa.force_follow_delay_seconds ?? 10) * 1000;
    const timer = setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;

      followOA({ id: oaId }).then(async () => {
        let idByOA: string | undefined;
        const retryDelays = [0, 2000, 3000];
        for (let i = 0; i < retryDelays.length; i++) {
          if (retryDelays[i]) await new Promise((r) => setTimeout(r, retryDelays[i]));
          try {
            const ui = (await getUserInfo({})).userInfo as any;
            idByOA = ui?.idByOA as string | undefined;
            if (idByOA) break;
          } catch { /* ignore */ }
        }
        try {
          const oaResult = await api.setOAFollow("FOLLOWED", idByOA || undefined);
          setOa(oaResult);
        } catch { /* ignore */ }
        if (idByOA) api.setIdByOA(idByOA).catch(() => {});
      }).catch(() => { /* user cancelled (code -201) */ });
    }, delay);

    return () => clearTimeout(timer);
  }, [oa?.force_follow, oa?.followed, oa?.oa_id, oa?.force_follow_delay_seconds, config?.oa.oa_id, setOa]);

  return null;
};

export default ForceFollowOA;
