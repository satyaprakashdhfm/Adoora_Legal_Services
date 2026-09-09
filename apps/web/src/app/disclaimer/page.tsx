import { PolicyPage, policyMetadata } from "@/components/policy-page";

export const metadata = policyMetadata("disclaimer");

export default function Page() {
  return <PolicyPage slug="disclaimer" />;
}
