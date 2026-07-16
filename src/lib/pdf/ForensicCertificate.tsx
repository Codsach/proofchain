import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Define the styles matching the app colors
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0D1B2A", // Dark theme background
    color: "#FFFFFF",
    fontFamily: "Helvetica",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    lineHeight: 1.5,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#1B2A4A",
    paddingBottom: 15,
    marginBottom: 20,
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
    color: "#00C9A7", // Accent color
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerRight: {
    textAlign: "right",
  },
  headerLabel: {
    fontSize: 7,
    color: "#8E9AAF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerVal: {
    fontSize: 8,
    color: "#FFFFFF",
    fontFamily: "Courier",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#152A42", // Card background
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1B2A4A",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#00C9A7",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2A4A",
    paddingBottom: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCol: {
    width: "48%",
    marginBottom: 8,
  },
  label: {
    fontSize: 7,
    color: "#8E9AAF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: "#FFFFFF",
  },
  valueMono: {
    fontSize: 8,
    color: "#00C9A7",
    fontFamily: "Courier",
  },
  badgeVerified: {
    backgroundColor: "rgba(0, 201, 167, 0.1)",
    borderWidth: 1,
    borderColor: "#00C9A7",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeTextVerified: {
    color: "#00C9A7",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  descriptionBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1B2A4A",
  },
  descriptionText: {
    color: "#8E9AAF",
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  // Evidence tables
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1B2A4A",
    paddingVertical: 6,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#0D1B2A",
    borderBottomWidth: 2,
    borderBottomColor: "#00C9A7",
  },
  tableColName: {
    width: "25%",
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tableColSize: {
    width: "15%",
    fontSize: 8,
    color: "#8E9AAF",
  },
  tableColHash: {
    width: "60%",
    fontSize: 7.5,
    fontFamily: "Courier",
    color: "#FFFFFF",
  },
  tableTextHeader: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#8E9AAF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // AI Diagnostics styles
  aiBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1B2A4A",
  },
  aiFileTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  aiScoreVal: {
    fontSize: 8.5,
    color: "#00C9A7",
    fontFamily: "Courier",
    fontWeight: "bold",
  },
  aiFindingsList: {
    paddingLeft: 10,
    marginTop: 4,
  },
  aiFindingItem: {
    fontSize: 7.5,
    color: "#8E9AAF",
    marginBottom: 2,
  },
  // Footer QR block
  footerBlock: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#1B2A4A",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    width: "70%",
  },
  disclaimer: {
    fontSize: 6.5,
    color: "#8E9AAF",
    fontStyle: "italic",
    marginBottom: 4,
  },
  verifyText: {
    fontSize: 7,
    color: "#00C9A7",
    fontFamily: "Courier",
  },
  footerRight: {
    width: "25%",
    alignItems: "flex-end",
  },
  qrCode: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#1B2A4A",
    borderRadius: 4,
  },
  pageNumber: {
    fontSize: 7,
    color: "#8E9AAF",
    textAlign: "center",
    marginTop: 10,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00C9A7",
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

  return (
    <Document>
      {/* ── Page 1: Official Seal, Metadata, Verdict, Anchor ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
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

        {/* Section 1: Case Info */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>I. Forensic Subject Info</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridCol}>
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
              <Text style={styles.label}>Temporal Log (Origin)</Text>
              <Text style={styles.value}>{formatDate(caseData.incidentDate)}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Sealed Timestamp</Text>
              <Text style={styles.value}>{formatDate(caseData.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.descriptionBlock}>
            <Text style={styles.label}>Subject Profile & Description</Text>
            <Text style={styles.descriptionText}>{caseData.description || "No description provided."}</Text>
          </View>
        </View>

        {/* Section 2: Blockchain Security Anchor */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>II. Cryptographic Security Anchor</Text>
          <View style={styles.gridContainer}>
            <View style={{ width: "100%", marginBottom: 8 }}>
              <Text style={styles.label}>Blockchain Ledger Anchor (Polygon Network)</Text>
              <Text style={styles.valueMono}>
                {caseData.onChainTxHash || "Awaiting Cryptographic Anchor..."}
              </Text>
            </View>
            {verdict && (
              <View style={{ width: "100%" }}>
                <Text style={styles.label}>Cryptographic Verdict Hash</Text>
                <Text style={styles.valueMono}>{verdict.verdictHash}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section 3: Final Official Verdict */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>III. Validation Verdict</Text>
          {verdict ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeTextVerified}>{verdict.verdict}</Text>
                </View>
                <Text style={{ fontSize: 8, color: "#8E9AAF", marginLeft: 10 }}>
                  Issued on {new Date(verdict.issuedAt).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.label}>Verification Explanation</Text>
              <Text style={{ fontSize: 9, color: "#FFFFFF", fontStyle: "italic", lineHeight: 1.4, marginBottom: 8 }}>
                "{verdict.reason}"
              </Text>
              <Text style={styles.label}>Verified By</Text>
              <Text style={styles.value}>Authorized Forensic Analyst</Text>
            </View>
          ) : (
            <Text style={{ color: "#8E9AAF", fontStyle: "italic" }}>
              Official verification review is currently pending.
            </Text>
          )}
        </View>

        {/* Footer */}
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
              <Text style={{ fontSize: 6, color: "#8E9AAF" }}>QR Code Pending</Text>
            )}
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* ── Page 2: Evidence Modules and AI Threat Scan ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {logoDataUrl && <Image src={logoDataUrl} style={styles.logo} />}
            <View style={styles.headerLeft}>
              <Text style={styles.brandText}>ProofChain Secure Anchor</Text>
              <Text style={styles.certificateTitle}>Technical Appendix</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Subject UID</Text>
            <Text style={styles.headerVal}>{caseData.caseId.substring(0, 18).toUpperCase()}</Text>
          </View>
        </View>

        {/* Section 4: Evidence Integrity Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IV. Evidence Integrity & Chain log</Text>
          
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableColName, styles.tableTextHeader]}>File Artifact</Text>
            <Text style={[styles.tableColSize, styles.tableTextHeader]}>Size</Text>
            <Text style={[styles.tableColHash, styles.tableTextHeader]}>SHA-256 Digital Fingerprint / IPFS CID</Text>
          </View>

          {/* Table Rows */}
          {caseData.files.map((file, idx) => (
            <View key={file.fileId || idx} style={styles.tableRow} wrap={false}>
              <Text style={styles.tableColName}>{file.originalName}</Text>
              <Text style={styles.tableColSize}>{formatBytes(file.sizeBytes)}</Text>
              <View style={styles.tableColHash}>
                <Text style={{ fontSize: 6.5, fontFamily: "Courier", color: "#00C9A7" }}>
                  SHA256: {file.sha256Hash}
                </Text>
                <Text style={{ fontSize: 6.5, fontFamily: "Courier", color: "#8E9AAF", marginTop: 2 }}>
                  IPFS: {file.ipfsCid}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 5: AI Analysis Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>V. Neural Threat Scan Summary</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
            <View>
              <Text style={styles.label}>Overall Tamper Score</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#E63946" }}>
                {caseData.overallTamperScore !== null ? `${caseData.overallTamperScore}/100` : "N/A"}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Overall Risk Classification</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#00C9A7", textTransform: "uppercase" }}>
                {caseData.overallRiskLevel || "N/A"}
              </Text>
            </View>
          </View>

          {/* AI Reports details */}
          {aiReports && aiReports.length > 0 ? (
            <View>
              <Text style={[styles.label, { marginBottom: 6 }]}>Scan Details Per File Artifact:</Text>
              {aiReports.map((report, idx) => {
                const associatedFile = caseData.files.find((f) => f.fileId === report.fileId);
                return (
                  <View key={report.fileId || idx} style={{ marginBottom: 10 }} wrap={false}>
                    <View style={styles.aiBreakdownRow}>
                      <Text style={styles.aiFileTitle}>
                        {associatedFile ? associatedFile.originalName : `File ID: ${report.fileId.substring(0, 8)}...`}
                      </Text>
                      <Text style={styles.aiScoreVal}>Tamper Score: {report.tamperScore}/100 ({report.riskLevel.toUpperCase()})</Text>
                    </View>
                    
                    {report.geminiResult && report.geminiResult.findings && report.geminiResult.findings.length > 0 ? (
                      <View style={styles.aiFindingsList}>
                        {report.geminiResult.findings.slice(0, 3).map((finding, fIdx) => (
                          <Text key={fIdx} style={styles.aiFindingItem}>
                            • {finding}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 7.5, color: "#8E9AAF", fontStyle: "italic", marginLeft: 10 }}>
                        No anomalies flagged in metadata scanner.
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: "#8E9AAF", fontStyle: "italic" }}>
              No automated threat scan details available.
            </Text>
          )}
        </View>

        {/* Footer */}
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
              <Text style={{ fontSize: 6, color: "#8E9AAF" }}>QR Code Pending</Text>
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
