import { useEffect, useState } from "react";

export type ViewRole = "director" | "creative";

const KEY = "agency-os:view-role";

/**
 * No accounts in this workspace — the role is just a view mode the person
 * picks for themselves (director tools vs. creative-only view).
 */
export function useViewRole() {
  const [role, setRole] = useState<ViewRole>("director");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "director" || stored === "creative") setRole(stored);
  }, []);

  function update(next: ViewRole) {
    setRole(next);
    window.localStorage.setItem(KEY, next);
  }

  return { role, setRole: update, isDirector: role === "director" };
}
