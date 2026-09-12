/**
 * Insights, news and explainers.
 *
 * These are written as practitioner explainers — a question a client actually
 * asks, answered with the statutory position and the practical consequence.
 * They are informational and expressly not legal advice; every article page
 * carries that notice.
 *
 * When the CMS in `apps/api` goes live these move into the database and this
 * file becomes the seed data. Keep the shape stable.
 */

import type { ArtworkKey } from "@/components/insight-artwork";

export type InsightCategory =
  | "Regulatory Update"
  | "Explainer"
  | "Deal Announcement"
  | "Event Recap";

/** Body blocks, kept deliberately small so the renderer stays simple. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

export type Insight = {
  slug: string;
  title: string;
  category: InsightCategory;
  /** ISO date — used for sorting and for the Article schema. */
  date: string;
  /** Person slug from `people.ts`. */
  author: string;
  readingTime: string;
  summary: string;
  /**
   * Which generated composition heads the card — see `insight-artwork.tsx`.
   * Drawn rather than photographed because the firm has no photography for
   * these and stock legal imagery is uniformly bad.
   */
  artwork: ArtworkKey;
  /**
   * Path in `public/` to a real photograph for this article, once there is
   * one. Set it and the card uses it in place of the artwork.
   */
  image?: string;
  /**
   * Set when several articles share one image file laid out as a horizontal
   * strip: `index` is this article's frame, `frames` how many the file holds.
   * The card offsets the file rather than the file being sliced, so the strip
   * stays one request.
   */
  imageFrame?: { index: number; frames: number };
  keyTakeaways: string[];
  /** Practice-area slugs. */
  practices: string[];
  /** Industry slugs. */
  industries: string[];
  body: Block[];
};

export const insights: Insight[] = [
  {
    slug: "digital-lending-directions-what-your-lsp-agreement-must-say",
    title:
      "The RBI's digital lending framework: what your loan service provider agreement must actually say",
    category: "Regulatory Update",
    date: "2026-08-18",
    author: "r-adoora",
    readingTime: "7 min read",
    artwork: "network",
    image: "/three-article-images.png",
    imageFrame: { index: 0, frames: 3 },
    summary:
      "Most digital lending arrangements we review were drafted as ordinary service contracts and then patched for the RBI's directions. That order is the problem — the framework changes who may hold the customer, who may collect money, and what must be disclosed before the borrower commits.",
    keyTakeaways: [
      "The regulated entity remains accountable for the borrower relationship — outsourcing the technology does not outsource the obligation.",
      "The Key Fact Statement must disclose the all-in annual percentage rate, and any fee not in it cannot later be charged.",
      "Money must flow between the borrower and the regulated entity directly; the loan service provider's account should not sit in the middle.",
      "Data collected must be need-based and consented, and the LSP cannot retain borrower data on its own account.",
      "A cooling-off period must be genuinely available, not disclosed and then made impractical.",
    ],
    practices: ["banking-finance"],
    industries: ["financial-services", "technology-media-telecom"],
    body: [
      {
        type: "p",
        text: "A pattern shows up repeatedly when we are asked to review a digital lending stack. The commercial arrangement between the lender and its technology partner was negotiated first, as a services contract with a revenue share. The Reserve Bank of India's digital lending directions were then addressed by adding a compliance schedule at the back. The schedule says the right things. The operative clauses in the body of the agreement contradict it.",
      },
      {
        type: "p",
        text: "That is not a drafting nicety. The framework allocates responsibility in a way that a services contract, left to its own logic, will tend to reverse.",
      },
      { type: "h2", text: "The borrower belongs to the regulated entity" },
      {
        type: "p",
        text: "The starting principle is that the regulated entity — the bank or NBFC whose balance sheet carries the loan — remains answerable for the lending relationship regardless of how much of the journey a partner operates. A loan service provider may source the customer, run the interface, score the application and service the account. None of that transfers the regulatory obligation.",
      },
      {
        type: "p",
        text: "Where agreements go wrong is in the provisions that assume otherwise: exclusive control of the customer relationship granted to the platform, restrictions on the lender contacting its own borrowers, or data and marketing rights that treat the borrower base as the platform's asset. Those clauses are commercially understandable and regulatorily untenable.",
      },
      { type: "h2", text: "Disclosure: the Key Fact Statement is the document that matters" },
      {
        type: "p",
        text: "Before the borrower commits, they must receive a Key Fact Statement setting out the all-in cost of the loan expressed as an annual percentage rate, together with the recovery mechanism, the grievance officer's details and the cooling-off period. The rule that gives this teeth is the corollary: a charge not disclosed in the KFS cannot be recovered from the borrower later.",
      },
      {
        type: "p",
        text: "In practice this requires the product and legal teams to agree on something they often have not — a single number. Processing fees, insurance premiums bundled into the disbursement, platform convenience charges and penal amounts all have to be accounted for. We have seen arrangements where the platform's fee was structured as a separate charge to the borrower precisely so that it sat outside the lender's rate card. Under the current framework that is a disclosure failure with a direct revenue consequence.",
      },
      { type: "h2", text: "Money should not pass through the partner" },
      {
        type: "p",
        text: "Disbursement must go from the lender's account to the borrower's account, and repayment from the borrower's account to the lender's, without the loan service provider's pool account in between. The exception is narrow and specific. This single requirement invalidates a good number of older escrow-and-sweep designs, and it is worth checking against the actual payment flow rather than the flow diagram in the agreement, because the two are not always the same.",
      },
      { type: "h2", text: "Data: need-based, consented, and not the platform's to keep" },
      {
        type: "p",
        text: "Data collection must be limited to what the product needs, with the borrower's explicit consent and an option to withdraw it. Access to the borrower's contact list, media files and location — historically the source of the sector's worst conduct — is outside what is permissible for a lending app. The loan service provider must not store borrower data other than basic minimum data required for its function.",
      },
      {
        type: "p",
        text: "The Digital Personal Data Protection Act, 2023 now runs alongside this. The two regimes have different architectures and are best handled together at the design stage: the RBI's rules restrict what may be collected in this specific context, while the DPDP Act governs notice, purpose limitation, retention and the borrower's rights over the data once collected. Building consent flows for one and retrofitting the other is how organisations end up with a notice that does not describe what the product does.",
      },
      { type: "h2", text: "Recovery and grievance" },
      {
        type: "p",
        text: "Recovery agents must be identified to the borrower and their conduct is the regulated entity's responsibility. A nodal grievance redressal officer must be named and reachable, and unresolved complaints escalate to the RBI's ombudsman scheme. Agreements should therefore specify not merely that the partner will comply with recovery norms, but the audit rights, conduct standards, escalation timelines and termination consequences that make compliance verifiable.",
      },
      { type: "h2", text: "What to do with an existing arrangement" },
      {
        type: "ol",
        items: [
          "Map the actual payment flow, end to end, and compare it with the agreement. Discrepancies here are the most common and the most serious.",
          "Reconcile the KFS against every charge the borrower actually pays, including anything invoiced by the platform.",
          "Review the app's permissions and the data the partner stores, then align the notice, the consent flow and the contract with what the product genuinely requires.",
          "Check the operative clauses — customer relationship, data rights, exclusivity — for anything that contradicts the compliance schedule, and fix the body of the agreement rather than the schedule.",
          "Confirm the cooling-off mechanism works in the product, not just on paper.",
        ],
      },
      {
        type: "p",
        text: "None of this is difficult once the arrangement is looked at as a regulated lending relationship that happens to be delivered digitally, rather than as a technology partnership that happens to involve credit. The sequence of drafting is what usually needs to change.",
      },
    ],
  },
  {
    slug: "title-investigation-telugu-states-what-a-title-report-checks",
    title:
      "Title investigation in the Telugu states: what a clean title report actually checks",
    category: "Explainer",
    date: "2026-07-29",
    author: "m-rao",
    readingTime: "8 min read",
    artwork: "parcels",
    image: "/three-article-images.png",
    imageFrame: { index: 1, frames: 3 },
    summary:
      "Buyers often ask for a title report as a formality before completion. It is better understood as the exercise that decides whether there is anything to complete — and the defects it finds in Telangana and Andhra Pradesh follow recognisable patterns.",
    keyTakeaways: [
      "An encumbrance certificate shows registered transactions only; a great deal that affects title is never registered.",
      "Unrecorded family partitions are the most frequent defect, and curing them requires cooperation from people who may be hard to find.",
      "Assigned land, endowment land and ceiling surplus land carry restrictions that no amount of consideration cures.",
      "Dharani and Webland entries are strong evidence of possession and revenue record, not conclusive proof of title.",
      "Do a short preliminary check before paying an advance — it is where most unsuitable parcels are identified.",
    ],
    practices: ["real-estate-infrastructure"],
    industries: ["real-estate-construction", "manufacturing"],
    body: [
      {
        type: "p",
        text: "There is a version of land diligence that consists of obtaining an encumbrance certificate, reading the last sale deed, and confirming the seller's name matches. It is quick, it is inexpensive, and it misses most of what goes wrong.",
      },
      {
        type: "p",
        text: "A title investigation worth commissioning asks a harder question: can this seller convey clean, marketable, unencumbered title to this land, and if not, can the defect be cured before completion by someone whose cooperation we can actually secure?",
      },
      { type: "h2", text: "The chain of title, and why thirty years" },
      {
        type: "p",
        text: "The convention is to trace ownership back at least thirty years, which corresponds to the limitation period within which an adverse claim could still be asserted. Each link should be examined for whether the transferor had the capacity and authority to transfer, whether the instrument was properly stamped and registered, and whether the description of the property is consistent from one deed to the next.",
      },
      {
        type: "p",
        text: "Inconsistent property descriptions are more consequential than they look. Survey numbers get subdivided, boundaries are described by reference to neighbouring owners who have since sold, and extents stated in the deed diverge from what the revenue record shows. Reconciling the paper parcel with the physical parcel is part of the work, not an afterthought.",
      },
      { type: "h2", text: "What the encumbrance certificate does not tell you" },
      {
        type: "p",
        text: "An EC from the Sub-Registrar lists registered transactions affecting the property for the period searched. That makes it essential and insufficient in equal measure. It will not show an unregistered agreement to sell under which someone has paid and taken possession, a family partition effected by conduct, a tenancy or lease not registered, a pending suit, or an acquisition notification.",
      },
      {
        type: "p",
        text: "So the search has to widen: revenue records and mutation entries, litigation searches in the local courts and the High Court, acquisition notifications, and a physical inspection to see who is actually in possession and whether anything on the ground contradicts the paper.",
      },
      { type: "h2", text: "The defects we see most often" },
      {
        type: "p",
        text: "First, and by a wide margin, unrecorded family arrangements. A partition among brothers is agreed, acted upon for thirty years, and never registered. Each branch treats its portion as its own. When one of them sells, the deed is executed by a person the records do not show as sole owner, and the purchaser acquires a title that any other branch can challenge. Curing this means locating every person with a potential share — often across cities or generations — and obtaining registered releases or a confirmation deed.",
      },
      {
        type: "p",
        text: "Second, restricted categories of land. Assigned land granted to landless poor cannot be alienated, and the prohibition does not lapse with time or with the number of intervening transfers. Endowment land belonging to a temple or charitable institution carries its own restrictions. Land held above the ceiling limit may be surplus and vest in the state. These are not defects that better drafting solves — they go to whether the land can be sold at all.",
      },
      {
        type: "p",
        text: "Third, agricultural status. Land classified as agricultural cannot be used for industrial or residential purposes without conversion or non-agricultural permission under the applicable state law. This is curable, and it is routine, but it is often the longest item on the timeline. Buyers planning a plant should treat the conversion as a critical-path approval rather than a formality to be handled after signing.",
      },
      {
        type: "p",
        text: "Fourth, powers of attorney. A general power of attorney used to execute a sale must be properly stamped and registered where the law requires, must actually authorise the specific transaction, and must be subsisting — it terminates on the principal's death. GPA-based transactions warrant more diligence, not less, and a purchaser who relies on one without verifying the principal is alive and the power unrevoked is taking a risk that is easy to avoid.",
      },
      { type: "h2", text: "Dharani, Webland and what a record proves" },
      {
        type: "p",
        text: "Telangana's Dharani portal and Andhra Pradesh's Webland system, alongside Karnataka's Bhoomi and Kaveri, have made revenue records considerably more accessible and have reduced the scope for manipulation. That is a real improvement.",
      },
      {
        type: "p",
        text: "It has not made the records conclusive proof of title. A revenue record evidences possession and the revenue authorities' recognition of it. Title still derives from the chain of documents interpreted under substantive law. A parcel with a clean Dharani entry and a defective chain of title is still a defective parcel — and, in the other direction, a record that has not been mutated does not by itself defeat a good title. Both are evidence; neither is the answer.",
      },
      { type: "h2", text: "Sequence the work" },
      {
        type: "p",
        text: "Start with a preliminary check — the last two or three deeds, the current EC, the revenue entry and the classification of the land. It is a few days' work and it identifies most parcels that are not worth pursuing, before you have paid an advance or committed to full diligence costs.",
      },
      {
        type: "p",
        text: "If the parcel survives that, commission the full investigation and expect a written report that classifies each defect as curable or fatal, says who has to act to cure it, and says how long that will take. A report that lists observations without reaching a view on marketability has not finished the job. And where defects are curable, tie the cure to the payment schedule: the point of leverage is the consideration still to be paid.",
      },
    ],
  },
  {
    slug: "non-compete-clauses-india-what-actually-holds",
    title: "Non-compete clauses in Indian employment contracts: what actually holds",
    category: "Explainer",
    date: "2026-07-11",
    author: "p-lakshmi",
    readingTime: "6 min read",
    artwork: "boundary",
    image: "/three-article-images.png",
    imageFrame: { index: 2, frames: 3 },
    summary:
      "Employers keep asking us to strengthen post-termination non-compete clauses. The more useful conversation is about what Section 27 of the Contract Act permits, and where the protection you actually need can be found instead.",
    keyTakeaways: [
      "Post-employment non-compete restraints are generally void under Section 27 of the Indian Contract Act, 1872 — length and reasonableness do not save them.",
      "Restrictions during employment, including exclusivity and garden leave, stand on much firmer ground.",
      "Confidentiality and trade secret protection is enforceable and is usually the protection the employer actually wanted.",
      "Non-solicitation of customers and employees is treated more favourably than a bare non-compete, though outcomes vary.",
      "Drafting a clause you know is unenforceable has costs — it weakens the credibility of the provisions that would have held.",
    ],
    practices: ["labour-employment", "intellectual-property"],
    industries: ["technology-media-telecom", "manufacturing", "startups-emerging"],
    body: [
      {
        type: "p",
        text: "A senior employee resigns and joins a competitor. The employment contract contains a twelve-month non-compete covering India. The employer wants to enforce it. The answer is usually that they cannot, and the follow-up question — what could we have done instead — is the one worth spending time on.",
      },
      { type: "h2", text: "Section 27 is a rule, not a balancing test" },
      {
        type: "p",
        text: "Section 27 of the Indian Contract Act, 1872 provides that an agreement by which anyone is restrained from exercising a lawful profession, trade or business is void to that extent. The provision contains one statutory exception, for the sale of goodwill of a business.",
      },
      {
        type: "p",
        text: "This is where Indian law diverges sharply from the common law jurisdictions that many contract templates come from. In England, a post-termination restraint may be upheld if it protects a legitimate interest and goes no further than reasonably necessary. Indian courts have consistently held that Section 27 admits no such reasonableness inquiry for post-employment restraints. A six-month, single-city, single-competitor non-compete is void for the same reason a five-year nationwide one is.",
      },
      {
        type: "quote",
        text: "Narrowing a post-termination non-compete does not make it enforceable. It makes it a narrower void clause.",
      },
      { type: "h2", text: "During employment is different" },
      {
        type: "p",
        text: "Restrictions that operate while the employment subsists are treated quite differently, because they are not a restraint on the employee's future trade — they are terms of the engagement. Exclusive service obligations, prohibitions on competing activity or moonlighting during employment, and garden leave arrangements where the employee remains employed and paid through the notice period are all workable.",
      },
      {
        type: "p",
        text: "Garden leave is worth particular attention because it does real protective work. An employee kept on the payroll through a meaningful notice period, away from customers and current information, is materially less useful to a competitor on arrival. It costs money, which is precisely why it is enforceable — the employee is not being restrained from earning a living.",
      },
      { type: "h2", text: "Confidentiality is where the protection actually lives" },
      {
        type: "p",
        text: "Obligations protecting confidential information and trade secrets survive termination and are enforceable, including by injunction. Courts have granted relief to restrain use or disclosure of customer lists, pricing data, technical know-how, formulations and source code.",
      },
      {
        type: "p",
        text: "But enforcement depends on groundwork most employers have not done. You have to be able to identify the specific information said to be confidential, show that it was treated as confidential in practice — access controls, marking, need-to-know distribution — and show that this employee had it. A confidentiality clause covering \"all information relating to the business\" is close to useless in court because it does not let a judge identify what is to be protected.",
      },
      {
        type: "p",
        text: "So the practical measures matter as much as the drafting: classify the information that genuinely warrants protection, restrict access to it, log that access, and run an exit process that recovers devices and documents and records what the employee had. That evidence is what makes an injunction application viable.",
      },
      { type: "h2", text: "Non-solicitation occupies a middle ground" },
      {
        type: "p",
        text: "Clauses restraining a departing employee from soliciting the employer's customers or poaching its staff have received a more sympathetic reception than bare non-competes, on the reasoning that they protect the employer's existing relationships rather than restraining the employee's trade. Outcomes are not uniform, and a clause drafted so broadly that it effectively prevents the employee from working in the industry will be read as a non-compete whatever it is called.",
      },
      {
        type: "p",
        text: "Drafted with restraint — named or defined customers the employee actually dealt with, a defined period, solicitation rather than mere dealing — these clauses are worth including and can be worth enforcing.",
      },
      { type: "h2", text: "What about the senior executive or the founder?" },
      {
        type: "p",
        text: "Two situations genuinely differ. Where a business is sold and the seller covenants not to compete, the goodwill exception to Section 27 applies and a properly drafted restraint can bind. And where a person is a shareholder rather than only an employee, restraints in a shareholders' agreement tied to their shareholding rest on a different footing from an employment non-compete — though a court will look at substance and will not enforce an employment restraint dressed up as a shareholder covenant.",
      },
      { type: "h2", text: "The drafting consequence" },
      {
        type: "p",
        text: "There is a real cost to including a clause you know to be void. It gives the employer false comfort, it discourages investment in the protections that would have worked, and when the matter reaches a court the presence of an obviously unenforceable restraint does not improve the credibility of the clauses next to it.",
      },
      {
        type: "p",
        text: "Our usual recommendation is to shift the emphasis: a meaningful notice period with garden leave, a specific and well-supported confidentiality regime, a proportionate non-solicitation clause, clean IP assignment, and a documented exit process. Taken together these deliver most of what employers hoped the non-compete would do, and they have the advantage of being enforceable.",
      },
    ],
  },
  {
    slug: "dpdp-start-with-the-data-map-not-the-privacy-notice",
    title: "DPDP compliance: start with the data map, not the privacy notice",
    category: "Explainer",
    date: "2026-06-24",
    author: "a-krishnan",
    readingTime: "6 min read",
    artwork: "datamap",
    summary:
      "The instinct when a data protection law arrives is to rewrite the privacy policy. That produces a document describing a business that does not exist. Everything the DPDP Act requires depends on first knowing what you hold and why.",
    keyTakeaways: [
      "A notice written before the data is mapped will describe purposes and retention periods the organisation cannot actually honour.",
      "Consent must be free, specific, informed, unconditional and unambiguous, with a withdrawal route as easy as the grant.",
      "Purpose limitation means a new use generally needs fresh consent — retrofitting is not available.",
      "Retention and deletion capability has to exist in the product, not only in the policy.",
      "Processor contracts run down the whole chain, including sub-processors.",
    ],
    practices: ["corporate-ma"],
    industries: ["technology-media-telecom", "financial-services", "healthcare-life-sciences", "startups-emerging"],
    body: [
      {
        type: "p",
        text: "When the Digital Personal Data Protection Act, 2023 began to occupy board agendas, the first instruction given to most legal teams was to update the privacy policy. It is an understandable place to start — it is the visible artefact — and it is the wrong one.",
      },
      {
        type: "p",
        text: "A notice is a description. If you write it before you know what the organisation actually collects, from whom, for what, where it is stored, how long it is kept and who else touches it, you will produce an accurate-sounding description of a business you do not run. Worse, you will have made public commitments — about purposes and retention in particular — that your systems cannot honour.",
      },
      { type: "h2", text: "Why the map comes first" },
      {
        type: "p",
        text: "Work through what the Act asks of a data fiduciary and notice how much of it presupposes an inventory.",
      },
      {
        type: "ul",
        items: [
          "Notice: you must tell the data principal what personal data you collect and the purposes for which it will be processed. You cannot state purposes you have not enumerated.",
          "Purpose limitation: processing is confined to the purpose for which consent was given, which requires knowing which data was collected under which consent.",
          "Data minimisation: you must limit collection to what is necessary for the stated purpose — a judgment you cannot make without seeing the fields you actually collect.",
          "Retention: data must be erased once the purpose is no longer served, which requires a retention position per data category and the technical means to delete.",
          "Data principal rights: access, correction and erasure requests must be answered, which means being able to find every copy of a person's data.",
          "Breach notification: you must report a personal data breach, which requires knowing what was in the affected system.",
          "Processor obligations: engagement of processors must be under a valid contract, which requires knowing who your processors and their sub-processors are.",
        ],
      },
      {
        type: "p",
        text: "Every one of those obligations resolves to the same prerequisite. The map is not a preliminary exercise; it is the compliance programme's foundation.",
      },
      { type: "h2", text: "What a usable data map records" },
      {
        type: "p",
        text: "Not a diagram. A register, maintained per processing activity, recording the data categories and specific fields, the categories of data principals, the purpose, the lawful basis, the systems and locations where it sits, the internal teams with access, the external processors and sub-processors receiving it, any cross-border element, and the retention period with the deletion mechanism.",
      },
      {
        type: "p",
        text: "The exercise is best run against systems rather than against departmental self-reporting. Ask engineering for the schema, look at what the application actually logs, and check the third-party SDKs in the mobile app. In our experience the map produced from interviews and the map produced from the systems differ substantially, and the difference is almost always data nobody remembered was being collected.",
      },
      { type: "h2", text: "Consent, and the limits of retrofitting" },
      {
        type: "p",
        text: "Consent under the Act must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and limited to the data necessary for the specified purpose. Withdrawal must be as easy as giving it, and the consequences of withdrawal fall on the fiduciary to manage.",
      },
      {
        type: "p",
        text: "Two practical consequences follow. Bundled consent — one checkbox covering service delivery, marketing and analytics — does not meet the specificity requirement. And a new purpose generally needs fresh consent rather than an amended notice. This is the point that most affects product roadmaps: using existing customer data to train a model, or to launch an adjacent service, is a new purpose. If the original notice and consent did not contemplate it, the answer is not a policy update.",
      },
      { type: "h2", text: "Retention: where policies most often outrun capability" },
      {
        type: "p",
        text: "It is straightforward to publish a retention schedule. It is considerably harder to delete a person's data from a production database, its replicas, the analytics warehouse, the backups, the log aggregation tool, the CRM and the support ticketing system. Organisations routinely publish a schedule they have no mechanism to enforce.",
      },
      {
        type: "p",
        text: "The honest sequence is to establish what deletion is currently possible, decide what capability needs building, and set retention periods you can meet — then publish those. A schedule you comply with beats an ambitious one you do not.",
      },
      { type: "h2", text: "The processor chain" },
      {
        type: "p",
        text: "A fiduciary may engage a processor only under a valid contract, and remains responsible for the processing. That responsibility does not stop at your direct vendor: if your analytics provider uses a sub-processor for storage, that sits within your chain. Contract remediation across a vendor estate is slow work, so it is worth starting early and prioritising by data sensitivity and volume rather than by contract renewal date.",
      },
      { type: "h2", text: "A workable order of operations" },
      {
        type: "ol",
        items: [
          "Map the data from the systems, not from interviews.",
          "Assess the gap between what you do and what the Act requires, ranked by exposure and by remediation effort.",
          "Fix collection first — stop taking what you do not need, since every unnecessary field is a permanent obligation.",
          "Rebuild consent and notice to match the mapped reality, and make withdrawal genuinely available.",
          "Build the retention and deletion capability, then publish the schedule it supports.",
          "Remediate processor contracts down the chain.",
          "Stand up the operational processes — rights requests, breach response, and the governance record you would hand a regulator.",
        ],
      },
      {
        type: "p",
        text: "The privacy notice comes at step four, and by then writing it is largely mechanical. That is the sign the earlier steps were done properly.",
      },
    ],
  },
  {
    slug: "section-9-interim-relief-before-arbitration-begins",
    title: "Interim relief before the tribunal exists: using Section 9 well",
    category: "Explainer",
    date: "2026-06-02",
    author: "s-venkatesh",
    readingTime: "6 min read",
    artwork: "interim",
    summary:
      "An arbitration clause does not leave you without a court while the tribunal is being constituted. Section 9 of the Arbitration and Conciliation Act is available before proceedings commence — and its practical value depends almost entirely on how quickly it is used.",
    keyTakeaways: [
      "Section 9 relief can be sought before arbitration commences, during it, and after an award until it is enforced.",
      "Once a tribunal is constituted, courts will not ordinarily entertain a Section 9 application — Section 17 relief from the tribunal is the route.",
      "An applicant must show the intention to arbitrate; Section 9 is not a way to obtain relief and then not arbitrate.",
      "The substantive thresholds mirror those for an injunction, and courts commonly require security or an undertaking as to damages.",
      "For foreign-seated arbitrations, Section 9 remains available unless the parties have excluded it.",
    ],
    practices: ["dispute-resolution", "banking-finance"],
    industries: ["infrastructure-energy", "financial-services", "real-estate-construction"],
    body: [
      {
        type: "p",
        text: "A client calls to say that a counterparty is about to dissipate the asset at the centre of a dispute, or call in a bank guarantee, or dispose of plant that a claim depends on. The contract provides for arbitration. No arbitrator has been appointed. The instinct is that nothing can be done until the tribunal exists.",
      },
      {
        type: "p",
        text: "Section 9 of the Arbitration and Conciliation Act, 1996 exists for precisely this gap.",
      },
      { type: "h2", text: "What Section 9 provides" },
      {
        type: "p",
        text: "A party may apply to a court for interim measures of protection before or during arbitral proceedings, or at any time after an arbitral award is made but before it is enforced. The measures available include preservation of the subject matter of the dispute, securing the amount in dispute, interim custody or sale of goods, appointment of a receiver, and interim injunctions.",
      },
      {
        type: "p",
        text: "The 2015 amendments added two important qualifications. First, where a court grants relief before commencement of arbitration, the arbitral proceedings must commence within ninety days of the order or within such further time as the court allows. Second, once the tribunal is constituted, a court shall not entertain a Section 9 application unless it finds circumstances that render the tribunal's own power under Section 17 ineffective.",
      },
      { type: "h2", text: "The window, and why speed matters" },
      {
        type: "p",
        text: "Those two provisions define a window. Before the tribunal exists, the court is the forum. After it exists, the tribunal is — and Section 17 gives it substantially the same powers, with its orders enforceable as if they were court orders.",
      },
      {
        type: "p",
        text: "The practical consequence is that Section 9 is a remedy for the early phase of a dispute, and delay costs you it. It also costs you on the merits: a party that waited months while the harm it now calls urgent was unfolding invites the obvious question. Where the facts warrant urgent protection, the application should follow within days.",
      },
      { type: "h2", text: "You must actually intend to arbitrate" },
      {
        type: "p",
        text: "Courts have been clear that Section 9 is not a standalone route to interim relief for a party that has no intention of arbitrating. The applicant must demonstrate a manifest intention to commence arbitration — which in practice means the invocation notice under Section 21 should have been issued, or should issue immediately. The ninety-day rule reinforces this: relief obtained and not followed by arbitration will not survive.",
      },
      { type: "h2", text: "The thresholds are the injunction thresholds" },
      {
        type: "p",
        text: "Although Section 9 is a statutory power, courts approach it on principles analogous to those governing interim injunctions: a prima facie case, irreparable harm not compensable in damages, and the balance of convenience. The applicant's own conduct matters, and material non-disclosure on an ex parte application is treated seriously.",
      },
      {
        type: "p",
        text: "Expect conditions. Courts frequently require an undertaking as to damages, security, or a deposit, particularly where the relief restrains a payment or freezes an asset. Clients should be told about this before the application is filed, because a client who is unwilling or unable to provide security has effectively decided not to pursue the relief.",
      },
      { type: "h2", text: "Bank guarantees: a narrow lane" },
      {
        type: "p",
        text: "A recurring application is to restrain encashment of an unconditional bank guarantee. Indian courts have consistently protected the autonomy of such instruments and will restrain invocation only in cases of established fraud of an egregious kind going to the root of the transaction, or special equities involving irretrievable injustice. Ordinary allegations that the underlying claim is disputed will not do. This is worth advising on candidly at the outset — the application is frequently attempted and rarely succeeds.",
      },
      { type: "h2", text: "Foreign-seated arbitrations" },
      {
        type: "p",
        text: "Following the 2015 amendments, Section 9 applies to international commercial arbitrations seated outside India, unless the parties have agreed otherwise. This gives a party with assets or a counterparty in India a route to interim protection here even where the seat is elsewhere. Whether the parties have excluded it, expressly or by necessary implication, is a question that turns on the arbitration agreement — and is worth checking when the clause is drafted rather than when the crisis arrives.",
      },
      { type: "h2", text: "Practical checklist" },
      {
        type: "ol",
        items: [
          "Confirm the arbitration agreement and the seat, and whether Section 9 has been excluded.",
          "Issue the Section 21 invocation notice, or be ready to issue it, so the intention to arbitrate is evidenced.",
          "Identify the specific asset or act to be protected and the concrete harm if it is not — generalised prejudice does not carry an application.",
          "Assemble contemporaneous documents; interim applications are decided on the paper record.",
          "Be ready on security or an undertaking as to damages, with the client's instructions already obtained.",
          "Move promptly, and start the arbitration within ninety days of any order.",
        ],
      },
      {
        type: "p",
        text: "Used early and on the right facts, Section 9 preserves the thing the arbitration is about. Used late, it becomes an expensive way of demonstrating that the harm was not as urgent as claimed.",
      },
    ],
  },
  {
    slug: "deal-value-threshold-cci-approval",
    title:
      "The deal value threshold: when CCI approval is needed even without turnover in India",
    category: "Regulatory Update",
    date: "2026-05-14",
    author: "r-adoora",
    readingTime: "5 min read",
    artwork: "threshold",
    summary:
      "The asset and turnover tests never captured acquisitions of businesses with large valuations and little revenue. The deal value threshold does — and it has changed the notification analysis for technology and early-stage transactions in particular.",
    keyTakeaways: [
      "A transaction valued above the prescribed deal value threshold is notifiable if the target has substantial business operations in India, regardless of assets or turnover.",
      "Deal value includes consideration of every kind — cash, shares, deferred and contingent amounts, non-compete payments and interconnected arrangements.",
      "\"Substantial business operations in India\" is assessed on user, subscriber, visitor or gross merchandise value proportions, not on revenue alone.",
      "The de minimis exemption does not assist a transaction caught by this threshold.",
      "Gun-jumping consequences are unchanged, so the assessment must be done before the parties integrate anything.",
    ],
    practices: ["corporate-ma"],
    industries: ["technology-media-telecom", "startups-emerging", "financial-services"],
    body: [
      {
        type: "p",
        text: "Merger control in India rested for years on assets and turnover. If the combined parties fell below the thresholds, or the target fell within the de minimis exemption, there was no filing — however large the transaction. That framework had an obvious gap: a business with tens of millions of users, a substantial valuation and almost no revenue was routinely unnotifiable.",
      },
      {
        type: "p",
        text: "The deal value threshold closes it. A transaction whose value exceeds the prescribed amount requires notification where the target has substantial business operations in India, irrespective of whether the asset or turnover tests are met.",
      },
      { type: "h2", text: "What counts towards deal value" },
      {
        type: "p",
        text: "Broadly, every form of consideration. That includes cash and non-cash consideration, the value of securities issued, deferred consideration and earn-outs, amounts payable under interconnected or contemporaneous arrangements, payments for non-compete covenants, and consideration for related arrangements such as technology transfer or brand licensing entered into as part of the same transaction.",
      },
      {
        type: "p",
        text: "Two features of this deserve attention when structuring. Contingent consideration counts, so an earn-out cannot be used to keep a deal below the line. And interconnected arrangements are aggregated, which means splitting a transaction into steps does not divide its value for threshold purposes. Where deferred amounts are genuinely uncertain, a valuation basis has to be adopted and documented rather than left open.",
      },
      { type: "h2", text: "Substantial business operations in India" },
      {
        type: "p",
        text: "The second limb is what confines the threshold to transactions with a real Indian nexus. It is assessed on operational metrics rather than revenue: the proportion of the target's users, subscribers, visitors or customers in India, and the proportion of its gross merchandise value or turnover attributable to India, measured against its global figures over the relevant period.",
      },
      {
        type: "p",
        text: "For a digital business this is the decisive question, and it is one the commercial team can usually answer immediately — India user share is a number most such businesses track. It is also a question worth asking early, because a global transaction with an Indian user base can be notifiable in India while raising no filing obligation in the acquirer's home jurisdiction.",
      },
      { type: "h2", text: "De minimis does not help" },
      {
        type: "p",
        text: "The small target exemption, which excludes transactions where the target's Indian assets and turnover fall below specified levels, was the provision that allowed most low-revenue acquisitions through. It does not apply to a transaction caught by the deal value threshold. This is precisely the point of the threshold, and it removes what had been the standard route to a no-filing conclusion for high-value, low-revenue targets.",
      },
      { type: "h2", text: "What this changes in practice" },
      {
        type: "p",
        text: "For technology, consumer internet and fintech transactions above the threshold, the notification analysis now has to be run properly rather than dismissed on the basis of the target's Indian revenue. That has timetable consequences: a filing adds weeks to months between signing and completion, and the conditions precedent, break provisions and long-stop date have to reflect it.",
      },
      {
        type: "p",
        text: "It also raises the stakes on gun-jumping. Consummating any part of a notifiable combination before clearance attracts penalties, and the prohibition covers more than closing — sharing competitively sensitive information, integrating operations, or exercising influence over the target's conduct in the interim period can each be problematic. Clean team arrangements and interim covenants should be settled at signing.",
      },
      { type: "h2", text: "The assessment to run at term sheet stage" },
      {
        type: "ol",
        items: [
          "Compute total deal value on the broad basis — every form of consideration, including contingent amounts and interconnected arrangements.",
          "If it exceeds the threshold, obtain the target's India-versus-global figures for users, subscribers, visitors and gross merchandise value.",
          "Run the asset and turnover tests in parallel; a transaction may be notifiable on either footing.",
          "Where notification is required, build the filing into the timetable and settle interim conduct covenants at signing.",
          "Document the analysis even where you conclude no filing is needed — the reasoning is what you will rely on if the question is raised later.",
        ],
      },
      {
        type: "p",
        text: "The threshold has not made Indian merger control unpredictable. It has made the analysis one that has to be done on its own terms, at a point in the deal when the answer can still shape the timetable.",
      },
    ],
  },
];

/** Newest first — used by the home page and the insights index. */
export const insightsByDate = [...insights].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export const insightBySlug = new Map(
  insights.map((insight) => [insight.slug, insight]),
);

export function insightsForPractice(slug: string, limit = 3): Insight[] {
  return insightsByDate
    .filter((insight) => insight.practices.includes(slug))
    .slice(0, limit);
}

export function insightsForIndustry(slug: string, limit = 3): Insight[] {
  return insightsByDate
    .filter((insight) => insight.industries.includes(slug))
    .slice(0, limit);
}

export const insightCategories: InsightCategory[] = [
  "Regulatory Update",
  "Explainer",
  "Deal Announcement",
  "Event Recap",
];
