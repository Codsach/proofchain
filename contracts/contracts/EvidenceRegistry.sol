// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EvidenceRegistry
 * @notice Immutable on-chain registry for digital forensic evidence.
 *         Stores file hashes, IPFS CIDs, custody transfers, and verdicts.
 *         No delete function exists by design.
 */
contract EvidenceRegistry {

    struct EvidenceRecord {
        bytes32 fileHash;       // SHA-256 of the evidence file
        string  ipfsCid;        // IPFS content identifier
        address submittedBy;    // system wallet address
        uint256 submittedAt;    // Unix timestamp (block.timestamp)
        bool    verdictIssued;
        bytes32 verdictHash;    // keccak256(analystId + verdict + reason + ts)
        uint256 verdictAt;
        uint256 transferCount;
    }

    struct TransferRecord {
        bytes32 transferHash;   // keccak256(fromId + toId + reason + ts)
        uint256 transferredAt;
    }

    mapping(string => EvidenceRecord)      public records;
    mapping(string => TransferRecord[])    public transferLog;

    event EvidenceSubmitted(
        string indexed caseId,
        bytes32 fileHash,
        uint256 timestamp
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

    function submitEvidence(
        string memory caseId,
        bytes32 fileHash,
        string memory ipfsCid
    ) external {
        require(records[caseId].submittedAt == 0, "Case already exists");
        require(fileHash != bytes32(0), "Invalid file hash");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");

        records[caseId] = EvidenceRecord({
            fileHash:      fileHash,
            ipfsCid:       ipfsCid,
            submittedBy:   msg.sender,
            submittedAt:   block.timestamp,
            verdictIssued: false,
            verdictHash:   bytes32(0),
            verdictAt:     0,
            transferCount: 0
        });

        emit EvidenceSubmitted(caseId, fileHash, block.timestamp);
    }

    function recordTransfer(
        string memory caseId,
        bytes32 transferHash
    ) external {
        require(records[caseId].submittedAt != 0, "Case not found");
        require(records[caseId].transferCount < 10, "Transfer limit reached");
        require(!records[caseId].verdictIssued, "Case is closed");
        require(transferHash != bytes32(0), "Invalid transfer hash");

        transferLog[caseId].push(TransferRecord({
            transferHash:  transferHash,
            transferredAt: block.timestamp
        }));
        records[caseId].transferCount++;

        emit CustodyTransferred(caseId, transferHash, block.timestamp);
    }

    function issueVerdict(
        string memory caseId,
        bytes32 verdictHash
    ) external {
        require(records[caseId].submittedAt != 0, "Case not found");
        require(!records[caseId].verdictIssued, "Verdict already issued");
        require(verdictHash != bytes32(0), "Invalid verdict hash");

        records[caseId].verdictIssued = true;
        records[caseId].verdictHash   = verdictHash;
        records[caseId].verdictAt     = block.timestamp;

        emit VerdictIssued(caseId, verdictHash, block.timestamp);
    }

    function getRecord(string memory caseId)
        external
        view
        returns (EvidenceRecord memory)
    {
        return records[caseId];
    }

    function getTransferLog(string memory caseId)
        external
        view
        returns (TransferRecord[] memory)
    {
        return transferLog[caseId];
    }

    function getTransferCount(string memory caseId)
        external
        view
        returns (uint256)
    {
        return records[caseId].transferCount;
    }
}
