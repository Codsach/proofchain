import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string }>;
}): Promise<Metadata> {
  const { caseId } = await params;
  const title = `ProofChain Verification: ${caseId.slice(0, 8)}...`;
  const description = `View cryptographic verification and immutable chain of custody for case ${caseId} on ProofChain.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ProofChain",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
