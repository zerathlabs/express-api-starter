import os from "node:os";

export interface NetworkAddressInfo {
  name: string;
  address: string;
}

/**
 * Retrieves non-internal IPv4 addresses of local network interfaces (Ethernet, Wi-Fi, etc.).
 */
export function getNetworkIpAddresses(): NetworkAddressInfo[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkAddressInfo[] = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      // Check for IPv4 family (handles both string 'IPv4' and number 4)
      const isIPv4 = net.family === "IPv4" || (net.family as unknown) === 4;
      if (isIPv4 && !net.internal) {
        results.push({ name, address: net.address });
      }
    }
  }

  return results;
}
