import { LaunchOptions as PlaywrightLaunchOptions } from 'playwright';

declare module 'playwright' {
  interface LaunchOptions {
    rockorbust?: RockOrBustOptions;
  }
}

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
   * Whether to use the local machine IP if no residential nodes are available.
   * If true, it bypasses the proxy entirely if the pool is empty.
   */
  fallbackToLocal?: boolean;
}

export type LaunchOptions = PlaywrightLaunchOptions & {
  rockorbust?: RockOrBustOptions;
};
