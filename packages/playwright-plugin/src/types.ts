import { LaunchOptions as PlaywrightLaunchOptions } from 'playwright';

export interface RockOrBustOptions {
  /**
   * Your RockOrBust access key (starts with rob_)
   */
  key: string;

  /**
   * The RockOrBust Gateway URL.
   * Defaults to https://robapi.buildshot.xyz/
   */
  gatewayUrl?: string;

  /**
   * Whether to enable fingerprint patching (stealth mode).
   * Defaults to true.
   */
  stealth?: boolean;

  /**
   * What to do if no residential nodes are available for your key.
   * - true: Fall back to the Gateway's VPS IP address.
   * - false: Fail the request with a 502 error (Default).
   */
  fallbackToVps?: boolean;
}

export type LaunchOptions = PlaywrightLaunchOptions & {
  rockorbust?: RockOrBustOptions;
};
