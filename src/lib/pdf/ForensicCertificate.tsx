import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Professional white theme styles for clean print output
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontFamily: "Helvetica",
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 30,
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  headerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0F766E", // Professional teal accent
    paddingBottom: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "column",
  },
  brandText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0F766E",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  headerRight: {
    textAlign: "right",
  },
  headerLabel: {
    fontSize: 7,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerVal: {
    fontSize: 8,
    color: "#0F172A",
    fontFamily: "Courier",
  },
  // Two column container for upper section layout
  twoColContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  leftCol: {
    width: "49%",
  },
  rightCol: {
    width: "49%",
  },
  section: {
    marginBottom: 12,
    backgroundColor: "#F8FAFC", // Light card background
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 3,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCol: {
    width: "48%",
    marginBottom: 6,
  },
  label: {
    fontSize: 6.5,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  value: {
    fontSize: 8,
    color: "#0F172A",
  },
  valueMono: {
    fontSize: 7.5,
    color: "#0F766E",
    fontFamily: "Courier",
  },
  badgeVerified: {
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    borderWidth: 1,
    borderColor: "#0F766E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignSelf: "flex-start",
  },
  badgeTextVerified: {
    color: "#0F766E",
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  badgeRejected: {
    backgroundColor: "rgba(225, 29, 72, 0.1)",
    borderWidth: 1,
    borderColor: "#E11D48",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignSelf: "flex-start",
  },
  badgeTextRejected: {
    color: "#E11D48",
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  descriptionBlock: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  descriptionText: {
    color: "#334155",
    fontSize: 7.5,
    lineHeight: 1.3,
  },
  // Evidence tables
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 4,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0F766E",
  },
  tableColName: {
    width: "35%",
    fontSize: 7.5,
    color: "#0F172A",
  },
  tableColSize: {
    width: "15%",
    fontSize: 7.5,
    color: "#64748B",
  },
  tableColHash: {
    width: "50%",
    fontSize: 7,
    fontFamily: "Courier",
    color: "#0F172A",
  },
  tableTextHeader: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Footer QR block
  footerBlock: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    width: "75%",
  },
  disclaimer: {
    fontSize: 6,
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 4,
    lineHeight: 1.2,
  },
  verifyText: {
    fontSize: 7.5,
    color: "#0F766E",
    fontFamily: "Courier",
  },
  footerRight: {
    width: "20%",
    alignItems: "flex-end",
  },
  qrCode: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
  },
  pageNumber: {
    fontSize: 6.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  logo: {
    width: 22,
    height: 22,
    marginRight: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#0F766E",
  },
});

interface FileRecord {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  ipfsCid: string;
}

interface CaseData {
  caseId: string;
  title: string;
  description: string;
  incidentDate: string | Date;
  incidentType: string;
  status: string;
  files: FileRecord[];
  createdAt: string | Date;
  overallTamperScore: number | null;
  overallRiskLevel: "low" | "medium" | "high" | null;
  onChainTxHash: string | null;
}

interface Verdict {
  verdict: "verified" | "rejected";
  reason: string;
  verdictHash: string;
  onChainTxHash: string | null;
  issuedAt: string | Date;
}

interface ExifData {
  software: string | null;
  gps_present: boolean;
  creation_timestamp: string | null;
  modification_timestamp: string | null;
  device: string | null;
  flags: string[];
}

interface GeminiResult {
  manipulation_likelihood: string;
  findings: string[];
  confidence: string;
}

interface AiReport {
  fileId: string;
  tamperScore: number;
  riskLevel: string;
  plainNotesSummary: string;
  exifData: ExifData;
  geminiResult: GeminiResult;
}

interface ForensicCertificateProps {
  caseData: CaseData;
  verdict: Verdict | null;
  aiReports: AiReport[];
  qrCodeDataUrl: string | null;
  verifyUrl: string;
  logoDataUrl: string | null;
}

const INCIDENT_LABELS: Record<string, string> = {
  data_breach: "Data Breach",
  insider_threat: "Insider Threat",
  malware: "Malware",
  phishing: "Phishing",
  other: "Other",
};

export default function ForensicCertificate({
  caseData,
  verdict,
  aiReports,
  qrCodeDataUrl,
  verifyUrl,
  logoDataUrl,
}: ForensicCertificateProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return "N/A";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  // Limit artifacts shown to fit perfectly on a single page
  const visibleFiles = caseData.files.slice(0, 3);
  const extraFilesCount = caseData.files.length - visibleFiles.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {logoDataUrl && <Image src={logoDataUrl} style={styles.logo} />}
            <View style={styles.headerLeft}>
              <Text style={styles.brandText}>ProofChain Secure Anchor</Text>
              <Text style={styles.certificateTitle}>Forensic Certificate</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Certificate UID</Text>
            <Text style={styles.headerVal}>{caseData.caseId.substring(0, 18).toUpperCase()}</Text>
          </View>
        </View>

        {/* Section 1 & 2 in Two Columns */}
        <View style={styles.twoColContainer}>
          {/* Column 1: Case identification */}
          <View style={styles.leftCol}>
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>I. Subject Identification</Text>
              <View style={styles.gridContainer}>
                <View style={{ width: "100%", marginBottom: 6 }}>
                  <Text style={styles.label}>Case ID</Text>
                  <Text style={styles.valueMono}>{caseData.caseId}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Incident Type</Text>
                  <Text style={styles.value}>
                    {INCIDENT_LABELS[caseData.incidentType] || caseData.incidentType || "Other"}
                  </Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>Temporal Log</Text>
                  <Text style={styles.value}>{formatDate(caseData.incidentDate)}</Text>
                </View>
              </View>
              <View style={styles.descriptionBlock}>
                <Text style={styles.label}>Subject Profile Description</Text>
                <Text style={styles.descriptionText}>
                  {caseData.description
                    ? caseData.description.length > 120
                      ? `${caseData.description.substring(0, 120)}...`
                      : caseData.description
                    : "No description provided."}
                </Text>
              </View>
            </View>
          </View>

          {/* Column 2: Cryptographic Custody Anchor */}
          <View style={styles.rightCol}>
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>II. Blockchain Anchor & Diagnostics</Text>
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.label}>Ledger Anchor (Polygon)</Text>
                <Text style={styles.valueMono}>
                  {caseData.onChainTxHash
                    ? `${caseData.onChainTxHash.substring(0, 20)}...${caseData.onChainTxHash.substring(caseData.onChainTxHash.length - 10)}`
                    : "Awaiting Cryptographic Anchor..."}
                </Text>
              </View>
              {verdict && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.label}>Verdict Hash</Text>
                  <Text style={styles.valueMono}>
                    {verdict.verdictHash
                      ? `${verdict.verdictHash.substring(0, 20)}...${verdict.verdictHash.substring(verdict.verdictHash.length - 10)}`
                      : "N/A"}
                  </Text>
                </View>
              )}
              <View style={styles.gridContainer}>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>AI Threat Score</Text>
                  <Text style={[styles.value, { fontWeight: "bold", color: caseData.overallTamperScore !== null && caseData.overallTamperScore > 50 ? "#E11D48" : "#0F766E" }]}>
                    {caseData.overallTamperScore !== null ? `${caseData.overallTamperScore}/100` : "N/A"}
                  </Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.label}>AI Risk Level</Text>
                  <Text style={[styles.value, { fontWeight: "bold", textTransform: "uppercase", color: caseData.overallRiskLevel === "high" ? "#E11D48" : caseData.overallRiskLevel === "medium" ? "#D97706" : "#0F766E" }]}>
                    {caseData.overallRiskLevel || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Section III: Evidence Integrity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. Evidence Artifacts Integrity</Text>
          
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableColName, styles.tableTextHeader]}>File Name</Text>
            <Text style={[styles.tableColSize, styles.tableTextHeader]}>Size</Text>
            <Text style={[styles.tableColHash, styles.tableTextHeader]}>SHA-256 Digital Fingerprint</Text>
          </View>

          {/* Table Rows */}
          {visibleFiles.map((file, idx) => (
            <View key={file.fileId || idx} style={styles.tableRow} wrap={false}>
              <Text style={styles.tableColName}>
                {file.originalName.length > 25 ? `${file.originalName.substring(0, 22)}...` : file.originalName}
              </Text>
              <Text style={styles.tableColSize}>{formatBytes(file.sizeBytes)}</Text>
              <Text style={styles.tableColHash}>
                {file.sha256Hash}
              </Text>
            </View>
          ))}
          
          {extraFilesCount > 0 && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={{ fontSize: 7, color: "#64748B", fontStyle: "italic", width: "100%" }}>
                + {extraFilesCount} additional file(s) registered under this cryptographic record (scan QR for full list).
              </Text>
            </View>
          )}
          
          {caseData.files.length === 0 && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={{ fontSize: 7.5, color: "#64748B", fontStyle: "italic" }}>
                No file evidence registered in this case.
              </Text>
            </View>
          )}
        </View>

        {/* Section IV: Official Verification Verdict */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>IV. Official Validation Verdict</Text>
          {verdict ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={verdict.verdict === "verified" ? styles.badgeVerified : styles.badgeRejected}>
                  <Text style={verdict.verdict === "verified" ? styles.badgeTextVerified : styles.badgeTextRejected}>
                    {verdict.verdict === "verified" ? "VERIFIED PROTOCOL" : "REJECTED"}
                  </Text>
                </View>
                <Text style={{ fontSize: 7.5, color: "#64748B", marginLeft: 8 }}>
                  Issued: {new Date(verdict.issuedAt).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.label}>Verdict Statement</Text>
              <Text style={{ fontSize: 7.5, color: "#334155", fontStyle: "italic", lineHeight: 1.3, marginBottom: 4 }}>
                "{verdict.reason.length > 200 ? `${verdict.reason.substring(0, 200)}...` : verdict.reason}"
              </Text>
              <Text style={{ fontSize: 7, color: "#64748B" }}>
                Verified By: <Text style={{ color: "#0F172A", fontWeight: "bold" }}>Authorized Forensic Analyst</Text>
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#64748B", fontStyle: "italic", fontSize: 7.5 }}>
              Forensic validation review is currently pending.
            </Text>
          )}
        </View>

        {/* Footer Area */}
        <View style={styles.footerBlock}>
          <View style={styles.footerLeft}>
            <Text style={styles.disclaimer}>
              DISCLAIMER: NOT A COURT-ADMISSIBLE FORENSIC REPORT. This certificate verifies cryptographic custody proof of registered digital assets anchored on the Polygon blockchain ledger.
            </Text>
            <Text style={styles.label}>Public Verification URL</Text>
            <Text style={styles.verifyText}>{verifyUrl}</Text>
          </View>
          <View style={styles.footerRight}>
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
            ) : (
              <Text style={{ fontSize: 6, color: "#64748B" }}>QR Code Pending</Text>
            )}
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
