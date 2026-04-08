"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  TUTORIAL_STEPS,
  type TutorialStep,
} from "@/lib/tutorial-steps";

const OVERLAY_Z = 9800;
const HIGHLIGHT_Z = OVERLAY_Z + 1;
const TOOLTIP_Z = OVERLAY_Z + 2;

function queryAnchor(anchor: string | undefined): HTMLElement | null {
  if (!anchor) return null;
  return document.querySelector(`[data-tutorial="${anchor}"]`);
}

function useTargetRect(
  open: boolean,
  stepIndex: number,
  step: TutorialStep | undefined,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    let raf = 0;
    let cancelled = false;

    const scheduleUpdate = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (cancelled) return;
        if (!open || !step) {
          setRect(null);
          return;
        }
        const anchor = step.anchor;
        if (!anchor) {
          setRect(null);
          return;
        }
        const el = queryAnchor(anchor);
        setRect(el ? el.getBoundingClientRect() : null);
      });
    };

    if (!open || !step) {
      scheduleUpdate();
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    const anchor = step.anchor;
    if (!anchor) {
      scheduleUpdate();
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    const el = queryAnchor(anchor);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "auto" });
    }

    scheduleUpdate();

    const onReflow = () => {
      scheduleUpdate();
    };
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, step, stepIndex]);

  return rect;
}

function tooltipPosition(
  rect: DOMRect | null,
  anchor: string | undefined,
): { top: number; left: number; maxWidth: number } {
  const margin = 12;
  const innerWidth =
    typeof window !== "undefined" ? window.innerWidth : 1024;
  const innerHeight =
    typeof window !== "undefined" ? window.innerHeight : 768;
  const maxWidth = Math.min(360, innerWidth - margin * 2);

  if (!anchor || !rect) {
    return {
      top: Math.max(margin, (innerHeight - 200) / 2),
      left: margin,
      maxWidth,
    };
  }

  const preferBelowTop = rect.bottom + margin;
  const cardApproxHeight = 200;
  const fitsBelow = preferBelowTop + cardApproxHeight < innerHeight;
  const top = fitsBelow
    ? preferBelowTop
    : Math.max(margin, rect.top - cardApproxHeight - margin);

  const left = Math.min(
    Math.max(margin, rect.left),
    innerWidth - maxWidth - margin,
  );

  return { top, left, maxWidth };
}

export interface TutorialTourProps {
  /** Renders a control that starts the tour. */
  trigger: (start: () => void) => ReactNode;
}

export function TutorialTour({ trigger }: TutorialTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = TUTORIAL_STEPS[stepIndex];
  const rect = useTargetRect(open, stepIndex, step);
  const pos = useMemo(
    () => tooltipPosition(rect, step?.anchor),
    [rect, step?.anchor],
  );

  const start = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const portalRoot = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      {trigger(start)}
      {portalRoot && open && step
        ? createPortal(
            <>
              <div
                className="fixed inset-0 bg-zinc-950/55 dark:bg-black/60"
                style={{ zIndex: OVERLAY_Z }}
                aria-hidden
              />
              {rect && step.anchor ? (
                <div
                  className="pointer-events-none fixed rounded-lg ring-4 ring-violet-500 ring-offset-2 ring-offset-zinc-100 dark:ring-violet-400 dark:ring-offset-zinc-950"
                  style={{
                    zIndex: HIGHLIGHT_Z,
                    top: rect.top - 6,
                    left: rect.left - 6,
                    width: rect.width + 12,
                    height: rect.height + 12,
                  }}
                />
              ) : null}
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="tutorial-tour-title"
                aria-describedby="tutorial-tour-body"
                className="fixed rounded-xl border border-zinc-200 bg-white p-4 pr-12 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                style={{
                  zIndex: TOOLTIP_Z,
                  top: pos.top,
                  left: pos.left,
                  width: pos.maxWidth,
                }}
              >
                <button
                  type="button"
                  aria-label="Close guided tour"
                  className="absolute right-2 top-2 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  onClick={close}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <p
                  id="tutorial-tour-title"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {step.title}{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    ({stepIndex + 1}/{TUTORIAL_STEPS.length})
                  </span>
                </p>
                <p
                  id="tutorial-tour-body"
                  className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                >
                  {step.body}
                </p>
                {!rect && step.anchor ? (
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                    This step targets part of the UI that is not visible yet—for
                    example run a compare or open an explanation, then use Back /
                    Next or reopen the tour.
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    disabled={stepIndex <= 0}
                    onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={stepIndex >= TUTORIAL_STEPS.length - 1}
                    onClick={() =>
                      setStepIndex((i) =>
                        Math.min(i + 1, TUTORIAL_STEPS.length - 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>,
            portalRoot,
          )
        : null}
    </>
  );
}
