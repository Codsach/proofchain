import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { EvidenceRegistry } from "../typechain-types";

describe("EvidenceRegistry", () => {
  let contract: EvidenceRegistry;

  const CASE_ID = "test-case-001";
  const FILE_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-file-content"));
  const IPFS_CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

  beforeEach(async () => {
    const Factory = await ethers.getContractFactory("EvidenceRegistry");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  describe("submitEvidence", () => {
    it("stores evidence record correctly", async () => {
      await contract.submitEvidence(CASE_ID, FILE_HASH, IPFS_CID);
      const record = await contract.getRecord(CASE_ID);

      expect(record.fileHash).to.equal(FILE_HASH);
      expect(record.ipfsCid).to.equal(IPFS_CID);
      expect(record.verdictIssued).to.be.false;
      expect(record.transferCount).to.equal(0n);
      expect(record.submittedAt).to.be.gt(0n);
    });

    it("allows multiple evidence submissions for the same case ID", async () => {
      await contract.submitEvidence(CASE_ID, FILE_HASH, IPFS_CID);
      const fileHash2 = ethers.keccak256(ethers.toUtf8Bytes("test-file-content-2"));
      const ipfsCid2 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi2";
      
      await expect(
        contract.submitEvidence(CASE_ID, fileHash2, ipfsCid2)
      ).to.not.be.reverted;

      const record = await contract.getRecord(CASE_ID);
      // CaseRecord should still hold primary file details
      expect(record.fileHash).to.equal(FILE_HASH);

      const nextId = await contract.nextEvidenceId();
      expect(nextId).to.equal(3n);
    });

    it("rejects zero file hash", async () => {
      await expect(
        contract.submitEvidence(CASE_ID, ethers.ZeroHash, IPFS_CID)
      ).to.be.revertedWith("Invalid file hash");
    });

    it("emits EvidenceSubmitted event", async () => {
      await expect(contract.submitEvidence(CASE_ID, FILE_HASH, IPFS_CID))
        .to.emit(contract, "EvidenceSubmitted")
        .withArgs(1n, CASE_ID, FILE_HASH, IPFS_CID);
    });
  });

  describe("recordTransfer", () => {
    beforeEach(async () => {
      await contract.submitEvidence(CASE_ID, FILE_HASH, IPFS_CID);
    });

    it("records a transfer", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("transfer-1"));
      await contract.recordTransfer(CASE_ID, hash);

      const log = await contract.getTransferLog(CASE_ID);
      expect(log.length).to.equal(1);
      expect(log[0].transferHash).to.equal(hash);
    });

    it("increments transfer count", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("t1"));
      await contract.recordTransfer(CASE_ID, hash);
      const record = await contract.getRecord(CASE_ID);
      expect(record.transferCount).to.equal(1n);
    });

    it("rejects transfer on non-existent case", async () => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("t1"));
      await expect(
        contract.recordTransfer("bad-case", hash)
      ).to.be.revertedWith("Case not found");
    });

    it("rejects transfer after verdict is issued", async () => {
      const vHash = ethers.keccak256(ethers.toUtf8Bytes("verdict"));
      await contract.issueVerdict(CASE_ID, vHash);

      const tHash = ethers.keccak256(ethers.toUtf8Bytes("transfer"));
      await expect(
        contract.recordTransfer(CASE_ID, tHash)
      ).to.be.revertedWith("Case is closed");
    });
  });

  describe("issueVerdict", () => {
    beforeEach(async () => {
      await contract.submitEvidence(CASE_ID, FILE_HASH, IPFS_CID);
    });

    it("records verdict correctly", async () => {
      const vHash = ethers.keccak256(ethers.toUtf8Bytes("verdict-data"));
      await contract.issueVerdict(CASE_ID, vHash);

      const record = await contract.getRecord(CASE_ID);
      expect(record.verdictIssued).to.be.true;
      expect(record.verdictHash).to.equal(vHash);
      expect(record.verdictAt).to.be.gt(0n);
    });

    it("rejects duplicate verdict", async () => {
      const vHash = ethers.keccak256(ethers.toUtf8Bytes("v1"));
      await contract.issueVerdict(CASE_ID, vHash);
      await expect(
        contract.issueVerdict(CASE_ID, vHash)
      ).to.be.revertedWith("Verdict already issued");
    });

    it("emits VerdictIssued event", async () => {
      const vHash = ethers.keccak256(ethers.toUtf8Bytes("v1"));
      await expect(contract.issueVerdict(CASE_ID, vHash))
        .to.emit(contract, "VerdictIssued")
        .withArgs(CASE_ID, vHash, anyValue);
    });
  });
});
