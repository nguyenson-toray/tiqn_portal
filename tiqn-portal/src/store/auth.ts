import { atom } from "jotai";
import type { Employee, Access, AppConfig, MeData, ChatTarget } from "@/api/types";

// Session token (in-memory only, persisted to Zalo storage separately)
export const tokenAtom = atom<string | null>(null);

// Employee profile
export const employeeAtom = atom<Employee | null>(null);

// Access mode
export const accessAtom = atom<Access | null>(null);

// Masked phone
export const maskedPhoneAtom = atom<string | null>(null);

// Login method (ZALO_PHONE, STORED_PHONE, DEV)
export const loginMethodAtom = atom<MeData["login_method"] | null>(null);

// OA follow state
export const oaAtom = atom<{ followed: boolean; show_invite: boolean }>({
  followed: false,
  show_invite: false,
});

// Chat target (C&B contact)
export const chatAtom = atom<ChatTarget | null>(null);

// Zalo avatar URL (fallback when backend has no avatar)
export const zaloAvatarAtom = atom<string | null>(null);

// App config (cached)
export const configAtom = atom<AppConfig | null>(null);

// Auth loading state
export const authLoadingAtom = atom(true);

// Is read-only mode
export const isReadOnlyAtom = atom((get) => {
  const access = get(accessAtom);
  return access?.mode === "READ_ONLY";
});
