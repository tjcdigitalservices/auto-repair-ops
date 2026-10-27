import { headers } from "next/headers";

import { normalizeIpAddress } from "@/lib/network/public-ip";

export {
  ipMatchesAllowedList,
  isPublicIpAddress,
  isValidIpAddress,
  normalizeIpAddress,
  normalizePublicIpAddress,
} from "@/lib/network/public-ip";

export type RequestNetworkContext = {
  requestIp: string | null;
  userAgent: string | null;
};

export async function getServerRequestNetworkContext(): Promise<RequestNetworkContext> {
  const headerStore = await headers();

  return {
    requestIp: normalizeIpAddress(
      headerStore.get("x-forwarded-for") ??
        headerStore.get("x-real-ip") ??
        headerStore.get("cf-connecting-ip") ??
        headerStore.get("x-client-ip"),
    ),
    userAgent: headerStore.get("user-agent"),
  };
}

