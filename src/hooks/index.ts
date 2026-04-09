import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { ResolvedConfig } from "../config";
import { getReadonlyEnabled } from "../readonly-state";
import { setupPermissionGateHook } from "./permission-gate";
import { setupPoliciesHook } from "./policies";

export function setupGuardrailsHooks(pi: ExtensionAPI, config: ResolvedConfig) {
  setupPoliciesHook(pi, config, getReadonlyEnabled);
  setupPermissionGateHook(pi, config, getReadonlyEnabled);
}
