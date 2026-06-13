declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PwaOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
  };

  export default function withPWAInit(
    options: PwaOptions,
  ): (config: NextConfig) => NextConfig;
}
