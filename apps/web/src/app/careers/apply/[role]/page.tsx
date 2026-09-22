import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareerForm } from "@/components/career-form";
import { roles, speculativeRole, roleBySlug } from "@/content/careers";

export function generateStaticParams() {
  return [...roles, speculativeRole].map((role) => ({ role: role.slug }));
}

export async function generateMetadata(
  props: PageProps<"/careers/apply/[role]">,
): Promise<Metadata> {
  const { role: slug } = await props.params;
  const role = roleBySlug.get(slug);

  if (!role) return { title: "Role not found" };

  return {
    title: `Apply — ${role.title}`,
    description: `Apply for ${role.title} at ADOORA Legal Services.`,
    alternates: { canonical: `/careers/apply/${role.slug}` },
  };
}

export default async function ApplyPage(
  props: PageProps<"/careers/apply/[role]">,
) {
  const { role: slug } = await props.params;
  const role = roleBySlug.get(slug);

  if (!role) notFound();

  return (
    <section className="container-page py-14 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-end">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-gold-deep"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
              <path
                d="M14 8H3M7 4L3 8l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to careers
          </Link>
        </div>

        <p className="eyebrow mt-8 inline-flex items-center gap-2.5 text-gold-deep">
          <span className="h-px w-8 bg-gold/50" />
          Apply now
        </p>
        <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {role.title}
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Share a few details and we&rsquo;ll be in touch.
        </p>

        <div className="mt-10 rounded-2xl border border-line bg-paper-warm p-6 sm:p-10">
          <CareerForm role={role.title} />
        </div>
      </div>
    </section>
  );
}
