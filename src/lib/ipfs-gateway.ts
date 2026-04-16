const DEFAULT_IPFS_GATEWAY_BASE = "https://gateway.pinata.cloud/ipfs";

function normalizeGatewayBase(base: string): string {
  return base.replace(/\/+$/, "");
}

export function getIpfsGatewayBase(): string {
  return normalizeGatewayBase(
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_BASE ?? DEFAULT_IPFS_GATEWAY_BASE
  );
}

export function getIpfsGatewayUrl(cid: string): string {
  return `${getIpfsGatewayBase()}/${cid}`;
}
