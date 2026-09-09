import { PolicyPage, policyMetadata } from "@/components/policy-page";

export const metadata = policyMetadata("cookies");

export default function Page() {
  return <PolicyPage slug="cookies" />;
}
