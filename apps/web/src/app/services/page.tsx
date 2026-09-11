import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { PracticesIndex } from "@/components/practices-index";

export const metadata: Metadata = {
  title: "Our Practices",
  description:
    "Practices at ADOORA Legal Services and the matters inside each: corporate and M&A, banking and finance, dispute resolution, real estate, labour and employment, technology, taxation and intellectual property.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Practices"
        title="Our practices"
        lead="The matters we handle, grouped by practice. Each practice has its own page setting out how the work is sequenced, the courts, tribunals and regulators involved, and the questions clients ask most often."
        trail={[{ label: "Home", href: "/" }, { label: "Practices" }]}
      />

      <div className="container-page py-14 sm:py-16">
        <PracticesIndex />
      </div>
    </>
  );
}
