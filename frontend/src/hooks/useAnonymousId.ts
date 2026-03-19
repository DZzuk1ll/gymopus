"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "gymopus_anonymous_id";

export function useAnonymousId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, storedId);
    }
    setId(storedId);
  }, []);

  return id;
}
