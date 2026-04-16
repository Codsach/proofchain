import { ethers } from "ethers";

// ABI — only the functions we call from Next.js
const ABI = [
  "function submitEvidence(string caseId, bytes32 fileHash, string ipfsCid) external",
  "function recordTransfer(string caseId, bytes32 transferHash) external",
  "function issueVerdict(string caseId, bytes32 verdictHash) external",
  "function getRecord(string caseId) external view returns (tuple(bytes32 fileHash, string ipfsCid, address submittedBy, uint256 submittedAt, bool verdictIssued, bytes32 verdictHash, uint256 verdictAt, uint256 transferCount))",
  "function getTransferLog(string caseId) external view returns (tuple(bytes32 transferHash, uint256 transferredAt)[])",
  "event EvidenceSubmitted(string indexed caseId, bytes32 fileHash, uint256 timestamp)",
  "event CustodyTransferred(string indexed caseId, bytes32 transferHash, uint256 timestamp)",
  "event VerdictIssued(string indexed caseId, bytes32 verdictHash, uint256 timestamp)",
];

// ── Provider and signer setup ─────────────────────────────────────────────────
function getContract() {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  const privateKey = process.env.SYSTEM_WALLET_PRIVATE_KEY;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      "Missing blockchain config: POLYGON_RPC_URL, SYSTEM_WALLET_PRIVATE_KEY, or NEXT_PUBLIC_CONTRACT_ADDRESS"
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, ABI, wallet);
}

function getReadOnlyContract() {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Missing POLYGON_RPC_URL or NEXT_PUBLIC_CONTRACT_ADDRESS");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(contractAddress, ABI, provider);
}

// ── Convert hex SHA-256 string to bytes32 ─────────────────────────────────────
function hexToBytes32(hex: string): string {
  const clean = hex.startsWith("0x") ? hex : `0x${hex}`;
  return ethers.zeroPadValue(clean, 32);
}

// ── Compute keccak256 hash for verdicts and transfers ─────────────────────────
export function computeVerdictHash(
  analystId: string,
  verdict: string,
  reason: string,
  timestampMs: number
): string {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`${analystId}:${verdict}:${reason}:${timestampMs}`)
  );
}

export function computeTransferHash(
  fromUserId: string,
  toUserId: string,
  reason: string,
  timestampMs: number
): string {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`${fromUserId}:${toUserId}:${reason}:${timestampMs}`)
  );
}

// ── Anchor evidence on submission ─────────────────────────────────────────────
export async function anchorEvidence(
  caseId: string,
  sha256Hash: string,
  ipfsCid: string
): Promise<string> {
  const contract = getContract();
  const fileHashBytes32 = hexToBytes32(sha256Hash);

  const tx = await contract.submitEvidence(caseId, fileHashBytes32, ipfsCid);
  const receipt = await tx.wait();

  return receipt.hash as string;
}

// ── Record custody transfer ────────────────────────────────────────────────────
export async function anchorTransfer(
  caseId: string,
  transferHash: string
): Promise<string> {
  const contract = getContract();
  const hashBytes32 = hexToBytes32(transferHash);

  const tx = await contract.recordTransfer(caseId, hashBytes32);
  const receipt = await tx.wait();

  return receipt.hash as string;
}

// ── Anchor verdict ─────────────────────────────────────────────────────────────
export async function anchorVerdict(
  caseId: string,
  verdictHash: string
): Promise<string> {
  const contract = getContract();
  const hashBytes32 = hexToBytes32(verdictHash);

  const tx = await contract.issueVerdict(caseId, hashBytes32);
  const receipt = await tx.wait();

  return receipt.hash as string;
}

// ── Read record from chain (public verification) ──────────────────────────────
export interface OnChainRecord {
  fileHash: string;
  ipfsCid: string;
  submittedBy: string;
  submittedAt: number;
  verdictIssued: boolean;
  verdictHash: string;
  verdictAt: number;
  transferCount: number;
}

export async function getOnChainRecord(
  caseId: string
): Promise<OnChainRecord | null> {
  try {
    const contract = getReadOnlyContract();
    const record = await contract.getRecord(caseId);

    if (!record || record.submittedAt === 0n) return null;

    return {
      fileHash: record.fileHash as string,
      ipfsCid: record.ipfsCid as string,
      submittedBy: record.submittedBy as string,
      submittedAt: Number(record.submittedAt),
      verdictIssued: record.verdictIssued as boolean,
      verdictHash: record.verdictHash as string,
      verdictAt: Number(record.verdictAt),
      transferCount: Number(record.transferCount),
    };
  } catch (err) {
    console.error("[blockchain/getRecord]", err);
    return null;
  }
}

export interface OnChainTransfer {
  transferHash: string;
  transferredAt: number;
}

export async function getOnChainTransferLog(
  caseId: string
): Promise<OnChainTransfer[]> {
  try {
    const contract = getReadOnlyContract();
    const log = await contract.getTransferLog(caseId);
    return log.map((t: { transferHash: string; transferredAt: bigint }) => ({
      transferHash: t.transferHash,
      transferredAt: Number(t.transferredAt),
    }));
  } catch (err) {
    console.error("[blockchain/getTransferLog]", err);
    return [];
  }
}