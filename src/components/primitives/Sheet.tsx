"use client";

/**
 * Responsive Sheet primitive (T025).
 *
 * One component that presents as a drawer on small viewports (bottom sheet by
 * default) and as a centred modal at `md` and above when `responsive` is true,
 * so the drawer→modal switch lives in a single component (WEB_ADAPTATION §4).
 *
 * Behaviour contract:
 * - `role="dialog"` + `aria-modal="true"`, labelled by its `title`.
 * - Focus trap: Tab / Shift+Tab cycle inside; initial focus moves into the sheet
 *   and is returned to the trigger element on close.
 * - Escape and backdrop click close (both opt-out via props).
 * - Body scroll is locked while open and restored exactly on close.
 * - RTL-safe: positioning and radius rely on logical properties only, so the
 *   side drawer flips with `dir`.
 * - `prefers-reduced-motion` disables all entrance motion.
 * - Controlled (`open` / `onOpenChange`) and uncontrolled (`defaultOpen`) usage
 *   are both supported.
 */

import type {
  ComponentPropsWithRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./utils";

export type SheetPlacement = "bottom" | "start" | "end";

export type SheetProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  /** Controlled open state. Omit to make the Sheet uncontrolled. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Called whenever the Sheet requests a state change. */
  onOpenChange?: (open: boolean) => void;
  /** Drawer placement below `md`. Always centred modal at `md`+. Default "bottom". */
  placement?: SheetPlacement;
  /** When true, the drawer becomes a centred modal at `md` and above. Default true. */
  responsive?: boolean;
  /** Dialog title; becomes the `aria-labelledby` id. */
  title?: ReactNode;
  /** Dialog description; becomes the `aria-describedby` id. */
  description?: ReactNode;
  /** Optional footer area, rendered below the scrollable content. */
  footer?: ReactNode;
  /** Close on Escape. Default true. */
  closeOnEscape?: boolean;
  /** Close when the dimmed backdrop is clicked. Default true. */
  closeOnBackdropClick?: boolean;
  /** Fired on Escape; returning with `event.preventDefault()` keeps the Sheet open. */
  onEscapeKeyDown?: (event: globalThis.KeyboardEvent) => void;
  /** Fired on backdrop click; returning with `event.preventDefault()` keeps the Sheet open. */
  onBackdropClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
  /** Show the decorative grabber handle. Defaults to true for `bottom` placement. */
  showGrabber?: boolean;
  /** Element to focus on open; defaults to the dialog panel itself. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Extra classes for the panel. */
  contentClassName?: string;
  /** Extra classes for the dimmed backdrop. */
  overlayClassName?: string;
  /** Portal container; defaults to `document.body`. */
  container?: HTMLElement | null;
};

const POSITIONER: Record<SheetPlacement, string> = {
  bottom: "items-end justify-center",
  start: "items-stretch justify-start",
  end: "items-stretch justify-end",
};

const RESPONSIVE_POSITIONER = "md:items-center md:justify-center";

const PANEL_PLACEMENT: Record<SheetPlacement, string> = {
  bottom: "max-h-[85dvh] rounded-ss-xl rounded-se-xl starting:translate-y-full",
  start:
    "max-w-[85vw] rounded-se-xl rounded-ee-xl ltr:starting:-translate-x-full rtl:starting:translate-x-full",
  end: "max-w-[85vw] rounded-ss-xl rounded-es-xl ltr:starting:translate-x-full rtl:starting:-translate-x-full",
};

const RESPONSIVE_PANEL =
  "md:max-w-[30rem] md:max-h-[85dvh] md:rounded-xl md:starting:translate-y-4 md:starting:translate-x-0";

const OVERLAY_CLASSES =
  "absolute inset-0 pointer-events-auto bg-base-black/50 transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let openSheetCount = 0;
let bodyOverflowBeforeLock: string | null = null;

function lockScroll(): void {
  openSheetCount += 1;
  if (openSheetCount === 1) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
}

function unlockScroll(): void {
  openSheetCount = Math.max(0, openSheetCount - 1);
  if (openSheetCount === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock ?? "";
    bodyOverflowBeforeLock = null;
  }
}

type InertTracker = {
  roots: Element[];
  previousStates: WeakMap<Element, boolean>;
};

const inertTrackers = new Map<Element, InertTracker>();

function recordPreviousState(tracker: InertTracker, child: Element): void {
  if (!tracker.previousStates.has(child)) {
    tracker.previousStates.set(child, child.hasAttribute("inert"));
  }
}

function setInertState(element: Element, inert: boolean): void {
  if (inert) {
    element.setAttribute("inert", "");
  } else {
    element.removeAttribute("inert");
  }
}

function inertSiblings(container: Element, root: Element): void {
  let tracker = inertTrackers.get(container);
  if (!tracker) {
    tracker = { roots: [], previousStates: new WeakMap() };
    inertTrackers.set(container, tracker);
  }

  tracker.roots.push(root);
  const topmost = tracker.roots[tracker.roots.length - 1]!;

  for (const child of Array.from(container.children)) {
    if (child === topmost) {
      continue;
    }
    recordPreviousState(tracker, child);
    setInertState(child, true);
  }
}

function uninertSiblings(container: Element, root: Element): void {
  const tracker = inertTrackers.get(container);
  if (!tracker) {
    return;
  }

  const rootIndex = tracker.roots.indexOf(root);
  if (rootIndex !== -1) {
    tracker.roots.splice(rootIndex, 1);
  }

  if (tracker.roots.length === 0) {
    for (const child of Array.from(container.children)) {
      const previous = tracker.previousStates.get(child);
      if (previous === undefined) {
        continue;
      }
      setInertState(child, previous);
    }
    inertTrackers.delete(container);
    return;
  }

  const topmost = tracker.roots[tracker.roots.length - 1]!;
  setInertState(topmost, tracker.previousStates.get(topmost) ?? false);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hidden &&
      !element.closest('[aria-hidden="true"]') &&
      element.tabIndex >= 0,
  );
}

export function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom",
  responsive = true,
  title,
  description,
  footer,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  onEscapeKeyDown,
  onBackdropClick,
  showGrabber,
  initialFocusRef,
  contentClassName,
  overlayClassName,
  container,
  children,
  className,
  ref,
  role = "dialog",
  ...rest
}: SheetProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  const [hasMounted, setHasMounted] = useState(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const sheetRootRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const setDialogRef = useCallback(
    (node: HTMLDivElement | null) => {
      dialogRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const requestClose = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  const requestCloseRef = useRef(requestClose);
  const onEscapeKeyDownRef = useRef(onEscapeKeyDown);
  const closeOnEscapeRef = useRef(closeOnEscape);

  useEffect(() => {
    requestCloseRef.current = requestClose;
    onEscapeKeyDownRef.current = onEscapeKeyDown;
    closeOnEscapeRef.current = closeOnEscape;
  }, [requestClose, onEscapeKeyDown, closeOnEscape]);

  useEffect(() => {
    if (!isOpen || !hasMounted) {
      return;
    }

    const dialogNode = dialogRef.current;
    if (dialogNode === null) {
      return;
    }
    const dialog: HTMLDivElement = dialogNode;

    const portalTarget = container ?? document.body;
    const rootNode = sheetRootRef.current;

    const previouslyActive = document.activeElement;
    previousFocus.current =
      previouslyActive instanceof HTMLElement ? previouslyActive : null;

    lockScroll();

    if (portalTarget && rootNode) {
      inertSiblings(portalTarget, rootNode);
    }

    if (initialFocusRef?.current && initialFocusRef.current.isConnected) {
      initialFocusRef.current.focus({ preventScroll: true });
    } else {
      dialog.focus({ preventScroll: true });
    }

    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        onEscapeKeyDownRef.current?.(event);
        if (closeOnEscapeRef.current && !event.defaultPrevented) {
          event.stopImmediatePropagation();
          requestCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusTarget = event.target as Node;

      if (focusTarget === dialog) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const focusables = getFocusableElements(dialog);
        if (focusables.length > 0) {
          (event.shiftKey
            ? focusables[focusables.length - 1]
            : focusables[0]
          )?.focus({ preventScroll: true });
        }
        return;
      }

      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (!dialog.contains(focusTarget)) {
        if ((event.target as Element | null)?.closest?.('[role="dialog"]')) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && focusTarget === first) {
        event.preventDefault();
        event.stopImmediatePropagation();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && focusTarget === last) {
        event.preventDefault();
        event.stopImmediatePropagation();
        first.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (portalTarget && rootNode) {
        uninertSiblings(portalTarget, rootNode);
      }
      unlockScroll();
      const previous = previousFocus.current;
      if (previous && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
      previousFocus.current = null;
    };
  }, [isOpen, hasMounted, initialFocusRef, container]);

  function handleOverlayClick(event: ReactMouseEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    onBackdropClick?.(event);
    if (closeOnBackdropClick && !event.defaultPrevented) {
      requestClose();
    }
  }

  if (!hasMounted || !isOpen) {
    return null;
  }

  const ariaLabel = rest["aria-label"];
  const ariaLabelledby = rest["aria-labelledby"];
  const ariaDescribedby = rest["aria-describedby"];

  const labelledBy =
    title !== undefined && ariaLabel === undefined ? titleId : ariaLabelledby;
  const describedBy =
    description !== undefined && ariaDescribedby === undefined
      ? descriptionId
      : ariaDescribedby;

  const panelProps = { ...rest };
  delete panelProps["aria-label"];
  delete panelProps["aria-labelledby"];
  delete panelProps["aria-describedby"];

  const grabber = showGrabber ?? placement === "bottom";

  const sheet = (
    <div ref={sheetRootRef} className="pointer-events-none fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={handleOverlayClick}
        className={cx(OVERLAY_CLASSES, overlayClassName)}
      />
      <div
        className={cx(
          "relative flex h-full w-full",
          POSITIONER[placement],
          responsive && RESPONSIVE_POSITIONER,
        )}
      >
        <div
          ref={setDialogRef}
          role={role}
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby={labelledBy || undefined}
          aria-describedby={describedBy || undefined}
          data-state={isOpen ? "open" : "closed"}
          className={cx(
            "pointer-events-auto relative flex w-full flex-col bg-surface-white-bg shadow-card",
            "outline-none transition duration-200 ease-out starting:opacity-0 motion-reduce:transition-none",
            PANEL_PLACEMENT[placement],
            responsive && RESPONSIVE_PANEL,
            contentClassName,
            className,
          )}
          {...panelProps}
        >
          {grabber && (
            <div
              aria-hidden="true"
              className="mx-auto mb-1 mt-3 h-2 w-10 rounded-full bg-neutral-300 md:hidden"
            />
          )}
          {(title !== undefined || description !== undefined) && (
            <header className="px-5 pb-3 pt-2">
              {title !== undefined && (
                <h2 id={titleId} className="text-h2 text-text-primary">
                  {title}
                </h2>
              )}
              {description !== undefined && (
                <p
                  id={descriptionId}
                  className={cx(
                    "text-body-sm text-text-sub-text",
                    title !== undefined && "mt-1",
                  )}
                >
                  {description}
                </p>
              )}
            </header>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
            {children}
          </div>
          {footer !== undefined && (
            <footer className="px-5 pb-5 pt-1">{footer}</footer>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, container ?? document.body);
}
