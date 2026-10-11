"use client";

import { useEffect, useRef, useState } from "react";
import { getRecaptchaToken, renderRecaptchaV2 } from "@/lib/captcha-client";

export type FormFeedback = { kind: "success" | "error" | "info"; text: string } | null;

export function usePublicForm(action: string) {
  const fallbackContainer = useRef<HTMLDivElement>(null);
  const [fallbackRequired, setFallbackRequired] = useState(false);
  const [fallbackToken, setFallbackToken] = useState("");
  const [feedback, setFeedback] = useState<FormFeedback>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!fallbackRequired || !fallbackContainer.current) return;
    let cancelled = false;
    renderRecaptchaV2(
      fallbackContainer.current,
      (token) => setFallbackToken(token),
      () => setFallbackToken(""),
    ).catch((error: unknown) => {
      if (!cancelled) {
        setFeedback({
          kind: "error",
          text: error instanceof Error ? error.message : "The fallback challenge is unavailable.",
        });
      }
    });
    return () => { cancelled = true; };
  }, [fallbackRequired]);

  const submitOnline = async <T,>(endpoint: string, values: Record<string, unknown>): Promise<T | null> => {
    setSubmitting(true);
    setFeedback(null);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("You are offline. This form can be saved locally and sent when you reconnect.");
      }
      if (fallbackRequired && !fallbackToken) {
        setFeedback({ kind: "info", text: "Complete the security check, then submit again." });
        return null;
      }
      const token = fallbackRequired ? fallbackToken : await getRecaptchaToken(action);
      const version = fallbackRequired ? "v2" : "v3";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ ...values, captchaToken: token, captchaVersion: version }),
      });
      const data = await response.json().catch(() => ({})) as {
        message?: string;
        error?: string;
        fallback?: "v2";
        success?: boolean;
      };
      if (data.fallback === "v2") {
        setFallbackRequired(true);
        setFeedback({ kind: "info", text: "Please complete the quick security check, then submit once more." });
        setFallbackToken("");
        return null;
      }
      if (!response.ok) throw new Error(data.message ?? data.error ?? "This request could not be sent yet.");
      setFeedback({ kind: "success", text: data.message ?? "Thank you. Your request has been received." });
      setFallbackRequired(false);
      setFallbackToken("");
      return data as T;
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "This request could not be sent yet." });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const showOfflineMessage = (text: string) => setFeedback({ kind: "info", text });

  return {
    fallbackContainer,
    fallbackRequired,
    feedback,
    setFeedback,
    submitting,
    submitOnline,
    showOfflineMessage,
  };
}
