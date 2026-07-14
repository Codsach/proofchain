// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice Immutable on-chain registry for digital forensic evidence.
 *         Stores file hashes, IPFS CIDs, custody transfers, and verdicts.
 *         No delete function exists by design.
 */
contract EvidenceRegistry {

    struct CaseRecord {
        bytes32 fileHash;       // primary/first evidence file hash
        string  ipfsCid;        // primary/first evidence IPFS CID
        address submittedBy;    // system wallet address
        uint256 submittedAt;    // Unix timestamp (block.timestamp)
        bool    verdictIssued;
        bytes32 verdictHash;    // keccak256(analystId + verdict + reason + ts)
        uint256 verdictAt;
        uint256 transferCount;
    }

    struct EvidenceRecord {
        uint256 evidenceId;
        string  caseId;
        bytes32 fileHash;       // SHA-256 of the evidence file
        string  ipfsCid;        // IPFS content identifier
        address submittedBy;    // system wallet address
        uint256 submittedAt;    // Unix timestamp
    }

    struct TransferRecord {
        bytes32 transferHash;   // keccak256(fromId + toId + reason + ts)
        uint256 transferredAt;
    }

    uint256 public nextEvidenceId = 1;

    mapping(string => CaseRecord)          public cases;
    mapping(uint256 => EvidenceRecord)     public records;
    mapping(string => TransferRecord[])    public transferLog;

    event EvidenceSubmitted(
        uint256 indexed evidenceId,
        string caseId,
        bytes32 fileHash,
        string ipfsCid
    );
    event CustodyTransferred(
        string indexed caseId,
        bytes32 transferHash,
        uint256 timestamp
    );
    event VerdictIssued(
        string indexed caseId,
        bytes32 verdictHash,
        uint256 timestamp
    );

    // ── Submit evidence ───────────────────────────────────────────────────────
    function submitEvidence(
        string memory caseId,
        bytes32 fileHash,
        string memory ipfsCid
    ) external {
        require(fileHash != bytes32(0), "Invalid file hash");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");

        // Initialize CaseRecord on the first submission for this caseId
        if (cases[caseId].submittedAt == 0) {
            cases[caseId] = CaseRecord({
                fileHash:      fileHash,
                ipfsCid:       ipfsCid,
                submittedBy:   msg.sender,
                submittedAt:   block.timestamp,
                verdictIssued: false,
                verdictHash:   bytes32(0),
                verdictAt:     0,
                transferCount: 0
            });
        }

        uint256 evidenceId = nextEvidenceId;
        records[evidenceId] = EvidenceRecord({
            evidenceId:    evidenceId,
            caseId:        caseId,
            fileHash:      fileHash,
            ipfsCid:       ipfsCid,
            submittedBy:   msg.sender,
            submittedAt:   block.timestamp
        });

        nextEvidenceId++;

        emit EvidenceSubmitted(evidenceId, caseId, fileHash, ipfsCid);
    }

    // ── Record custody transfer ───────────────────────────────────────────────
    function recordTransfer(
        string memory caseId,
        bytes32 transferHash
    ) external {
        require(cases[caseId].submittedAt != 0, "Case not found");
        require(cases[caseId].transferCount < 10, "Transfer limit reached");
        require(!cases[caseId].verdictIssued, "Case is closed");
        require(transferHash != bytes32(0), "Invalid transfer hash");

        transferLog[caseId].push(TransferRecord({
            transferHash:  transferHash,
            transferredAt: block.timestamp
        }));
        cases[caseId].transferCount++;

        emit CustodyTransferred(caseId, transferHash, block.timestamp);
    }

    // ── Issue verdict ─────────────────────────────────────────────────────────
    function issueVerdict(
        string memory caseId,
        bytes32 verdictHash
    ) external {
        require(cases[caseId].submittedAt != 0, "Case not found");
        require(!cases[caseId].verdictIssued, "Verdict already issued");
        require(verdictHash != bytes32(0), "Invalid verdict hash");

        cases[caseId].verdictIssued = true;
        cases[caseId].verdictHash   = verdictHash;
        cases[caseId].verdictAt     = block.timestamp;

        emit VerdictIssued(caseId, verdictHash, block.timestamp);
    }

    // ── Read functions ────────────────────────────────────────────────────────
    function getRecord(string memory caseId)
        external view returns (CaseRecord memory)
    {
        return cases[caseId];
    }

    function getTransferLog(string memory caseId)
        external view returns (TransferRecord[] memory)
    {
        return transferLog[caseId];
    }

    // New helper to fetch an individual evidence record by numeric ID
    function getEvidenceRecord(uint256 evidenceId)
        external view returns (EvidenceRecord memory)
    {
        return records[evidenceId];
    }

    function getTransferCount(string memory caseId)
        external view returns (uint256)
    {
        return cases[caseId].transferCount;
    }
}
