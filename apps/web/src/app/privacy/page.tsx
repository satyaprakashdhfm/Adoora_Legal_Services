import { PolicyPage, policyMetadata } from "@/components/policy-page";

export const metadata = policyMetadata("privacy");

export default function Page() {
  return <PolicyPage slug="privacy" />;
}
