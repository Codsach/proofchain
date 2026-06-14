import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "ProofChain Evidence Verification";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "40px",
          border: "8px solid #10b981",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(16, 185, 129, 0.05)",
            padding: "80px",
            borderRadius: "32px",
            border: "2px solid rgba(16, 185, 129, 0.2)",
            boxShadow: "0 0 100px rgba(16, 185, 129, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
            <div style={{
              width: "72px",
              height: "72px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "2px solid rgba(16, 185, 129, 0.5)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "24px"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <h1 style={{ color: "white", fontSize: "72px", margin: 0, fontWeight: "bold", letterSpacing: "-0.05em" }}>
              ProofChain
            </h1>
          </div>
          
          <p style={{ color: "#10b981", fontSize: "36px", textTransform: "uppercase", letterSpacing: "0.2em", margin: "20px 0", fontWeight: "bold" }}>
            Public Verification Signal
          </p>

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "28px", fontFamily: "monospace", marginTop: "10px" }}>
            SYSTEM_UID::{caseId}
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(16, 185, 129, 0.1)",
            padding: "20px 40px",
            borderRadius: "100px",
            marginTop: "60px",
            border: "1px solid rgba(16, 185, 129, 0.3)"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "16px" }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{ color: "#10b981", fontSize: "28px", fontWeight: "bold" }}>Immutable Chain of Custody</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
