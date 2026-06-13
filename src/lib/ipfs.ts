import { getIpfsGatewayUrl } from "./ipfs-gateway";

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export async function uploadToIPFS(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<IPFSUploadResult> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT is not defined");
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append("file", blob, filename);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS upload failed: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as { IpfsHash?: string };
  const cid = data.IpfsHash;

  if (!cid) {
    throw new Error("IPFS upload failed: missing Pinata CID in response");
  }

  return {
    cid,
    url: getIpfsGatewayUrl(cid),
  };
}

export async function fetchAndHashFromIPFS(
  cid: string
): Promise<string | null> {
  try {
    const res = await fetch(getIpfsGatewayUrl(cid));
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { sha256 } = await import("./hash");
    return sha256(buffer);
  } catch {
    return null;
  }
}
