import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { configLoader } from "./config";

/**
 * Runtime state for readonly mode.
 * Uses in-memory state for quick access and pi.appendEntry for persistence.
 */

interface ReadonlyPersistedState {
  enabled: boolean;
}

let currentReadonlyEnabled = false;

/**
 * Get the current readonly mode state.
 * Hooks use this to check state dynamically.
 */
export function getReadonlyEnabled(): boolean {
  return currentReadonlyEnabled;
}

/**
 * Set the readonly mode state and persist to session.
 */
export function setReadonlyState(
  enabled: boolean,
  pi: ExtensionAPI,
  ctx?: ExtensionContext,
): void {
  currentReadonlyEnabled = enabled;

  // Persist to session for reload/tree navigation support
  pi.appendEntry("guardrails-readonly", { enabled });

  // Update status line if context available
  if (ctx) {
    updateStatus(ctx);
  }
}

/**
 * Update the status line indicator.
 */
export function updateStatus(ctx: ExtensionContext): void {
  if (currentReadonlyEnabled) {
    ctx.ui.setStatus(
      "guardrails-readonly",
      ctx.ui.theme.fg("warning", "[readonly]"),
    );
  } else {
    ctx.ui.setStatus("guardrails-readonly", undefined);
  }
}

/**
 * Restore readonly state from session or config.
 * Called on session_start and session_tree.
 */
export function restoreReadonlyState(
  ctx: ExtensionContext,
  pi: ExtensionAPI,
): void {
  // First check session state (most recent, survives reloads)
  const branchEntries = ctx.sessionManager.getBranch();
  const entry = branchEntries.findLast(
    (
      e,
    ): e is typeof e & { type: "custom"; customType: "guardrails-readonly" } =>
      e.type === "custom" && e.customType === "guardrails-readonly",
  );
  if (entry) {
    const data = entry.data as ReadonlyPersistedState | undefined;
    if (data?.enabled !== undefined) {
      currentReadonlyEnabled = data.enabled;
      updateStatus(ctx);
      return;
    }
  }

  // Check resolved config (merges global, local, memory scopes)
  const config = configLoader.getConfig();
  if (config.readOnlyMode.enabled) {
    currentReadonlyEnabled = true;
    updateStatus(ctx);
    // Persist so it's available after reload
    pi.appendEntry("guardrails-readonly", { enabled: true });
    return;
  }

  // Default to disabled
  currentReadonlyEnabled = false;
  updateStatus(ctx);
}

/**
 * Initialize readonly state on startup with CLI flag support.
 */
export function initializeReadonlyState(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
): void {
  // Check CLI flag first
  const readonlyFlag = pi.getFlag("readonly");
  if (readonlyFlag === true) {
    setReadonlyState(true, pi, ctx);
    ctx.ui.notify("Readonly mode enabled via --readonly flag", "info");
    return;
  }

  // Otherwise restore from session/config
  restoreReadonlyState(ctx, pi);
}
