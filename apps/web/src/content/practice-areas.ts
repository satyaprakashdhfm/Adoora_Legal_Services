import type { PracticeArea, ServiceItem } from "./types";
import { anchorFor } from "@/lib/anchor";

/**
 * One entry per practice area. Each gets its own URL at `/services/[slug]`
 * so the page can be indexed and cited independently.
 *
 * Copy rules: describe capability and process, never outcomes. "We advise on
 * X" is fine; "we win X" is not. See `src/content/legal.ts` for why.
 */
export const practiceAreas: PracticeArea[] = [
  {
    slug: "banking-finance",
    name: "Banking & Finance",
    shortName: "Banking & Finance",
    group: "Finance",
    tagline:
      "Lending, borrowing and security across rupee and foreign currency structures — from term sheet to enforcement.",
    overview: [
      {
        heading: "The regulatory environment",
        body: [
          "India's banking and finance sector is closely regulated by the Reserve Bank of India, and — where instruments are listed or privately placed — by the Securities and Exchange Board of India. Master Directions on external commercial borrowings, the framework for resolution of stressed assets, and the rules on lending against securities all move frequently, and each revision changes what a lender can price, secure and enforce.",
          "Two developments dominate current practice. The first is the shift of credit onto digital rails: the RBI's directions on digital lending, outsourcing of IT services and customer protection have pulled data protection and cybersecurity obligations squarely into loan documentation. The second is the maturing of the Insolvency and Bankruptcy Code, 2016, which has changed how security is valued at the point it matters most — recovery.",
          "A financing that reads well on paper can still fail at enforcement if the security interest was imperfectly created, registered late with the Central Registry, or structured without regard to the borrower's own regulatory perimeter. Much of our work in this area is about closing that gap before it opens.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We act for both sides of the credit relationship — lenders and borrowers — on rupee facilities, external commercial borrowings, overseas direct investment structures, acquisition and promoter financing, project and infrastructure debt, working capital lines, and the full suite of security documentation that sits beneath them.",
          "Our approach pairs close knowledge of the local statutory position — stamp duty across Andhra Pradesh, Karnataka and Telangana, registration practice, state-level charge creation — with the drafting conventions international lenders expect. We flag the legal risk and the commercial consequence together, because in a financing they are rarely separable.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Public sector and private sector banks, global banks lending into India, non-banking financial companies, credit funds and investment houses, asset reconstruction companies, and corporate borrowers ranging from listed groups to first-time issuers.",
          "Transaction sizes on which members of the team have advised range from approximately USD 5 million to USD 2 billion.",
        ],
      },
    ],
    services: [
      {
        short: "rupee & foreign currency debt",
        title: "Rupee and foreign currency debt",
        body:
          "Structuring and drafting for term loans, working capital facilities and syndicated credit — facility agreements, inter-creditor arrangements, hypothecation and mortgage documents, guarantees and pledges. On the lender side we run legal due diligence on the borrower and the security package; on the borrower side we negotiate conditions precedent, covenant packages and events of default the business can actually live with.",
      },
      {
        short: "external commercial borrowings",
        title: "External commercial borrowings and cross-border credit",
        body:
          "Eligibility, end-use restrictions, all-in-cost ceilings, minimum average maturity, hedging requirements and Loan Registration Number filings under the RBI's ECB framework. We also advise on overseas direct investment structures and the FEMA consequences of guarantees given by Indian parents for offshore subsidiaries.",
      },
      {
        short: "corporate debt & debt markets",
        title: "Corporate debt and debt capital markets",
        body:
          "Private placements of non-convertible debentures, debenture trust deeds and security trustee arrangements, information memorandum review, stock exchange listing formalities, and compliance with SEBI's issue and listing regulations and the electronic book provider platform requirements.",
      },
      {
        short: "restructuring & stressed assets",
        title: "Restructuring and stressed assets",
        body:
          "Refinancing and resolution plans within the RBI's prudential framework, one-time settlements, securitisation and assignment of loans to asset reconstruction companies, and analysis of existing security documents to establish what can be enforced, by whom, and in what order.",
      },
      {
        short: "insolvency & bankruptcy",
        title: "Insolvency advisory and litigation support",
        body:
          "Section 7 and Section 9 applications, defending admission, claim filing and verification, committee of creditors representation, scrutiny of resolution plans, avoidance applications and appeals. We run the insolvency, restructuring and dispute resolution angles as one brief rather than three.",
      },
      {
        short: "enforcement & recovery",
        title: "Enforcement and recovery",
        body:
          "Measures under the SARFAESI Act, 2002 and proceedings before the Debts Recovery Tribunals, possession and sale of secured assets, and coordination of parallel civil, criminal and regulatory tracks where a default has more than one cause.",
      },
      {
        short: "banking regulatory",
        title: "Banking regulatory advice",
        body:
          "Specialised advice on questions arising under the Foreign Exchange Management Act, 1999, RBI licensing and Master Directions, NBFC scale-based regulation, digital lending guidelines, priority sector lending classification, and the outsourcing and customer protection frameworks.",
      },
    ],
    matters: [
      "Advised a consortium of public sector banks on the security package and inter-creditor arrangements for a rupee term loan to a Telangana-based pharmaceutical manufacturer.",
      "Acted for an offshore lender on ECB documentation and FEMA compliance for a foreign currency facility to an Indian renewable energy platform.",
      "Advised an asset reconstruction company on the assignment of a portfolio of non-performing loans, including review of the underlying security documents and the registration position.",
      "Represented a financial creditor in corporate insolvency resolution proceedings before the NCLT, from Section 7 admission through committee of creditors deliberations on competing resolution plans.",
      "Advised a listed corporate borrower on a private placement of secured, redeemable non-convertible debentures, including the debenture trust deed and listing formalities.",
      "Acted for a non-banking financial company on the restructuring of a promoter financing facility secured by pledged listed shares.",
    ],
    forums: [
      "Reserve Bank of India",
      "Securities and Exchange Board of India",
      "National Company Law Tribunal — Hyderabad, Amaravati and Bengaluru benches",
      "National Company Law Appellate Tribunal",
      "Debts Recovery Tribunals and the Debts Recovery Appellate Tribunal",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
      "Central Registry of Securitisation Asset Reconstruction and Security Interest (CERSAI)",
    ],
    process: [
      {
        stage: "Term sheet review",
        detail:
          "We read the commercial terms against the regulatory perimeter before drafting starts — eligibility, end-use, pricing caps and security feasibility. Far cheaper to resolve here than at signing.",
      },
      {
        stage: "Due diligence",
        detail:
          "Corporate authority, title and encumbrance searches, the existing charge position, and consents required from prior lenders. Deliverable is a due diligence report with a risk register.",
      },
      {
        stage: "Documentation",
        detail:
          "Facility and security documents, with stamp duty and registration mapped for each state in which an asset sits. Turnaround depends on the number of security providers, not the loan size.",
      },
      {
        stage: "Conditions precedent and disbursement",
        detail:
          "CP checklist management, legal opinions where required, and confirmation of perfection steps — filings with the Registrar of Companies and CERSAI, and sub-registrar registration where relevant.",
      },
      {
        stage: "Post-closing and ongoing",
        detail:
          "Covenant monitoring support, waivers and amendments, annual compliance filings, and — if the credit deteriorates — early advice on restructuring or enforcement options.",
      },
    ],
    team: [],
    relatedIndustries: [
      "financial-services",
      "infrastructure-energy",
      "real-estate-construction",
    ],
    faqs: [
      {
        q: "Do you act for lenders, borrowers, or both?",
        a: "Both, though never on opposite sides of the same transaction. We run a conflicts check before taking on any new financing instruction and will tell you promptly if we cannot act.",
      },
      {
        q: "How long does a secured rupee financing take to document?",
        a: "For a single-lender facility with a straightforward security package, three to five weeks from term sheet to signing is realistic. Consortium facilities, multiple security providers, or assets across several states extend that — usually because of stamp duty and registration mechanics rather than negotiation.",
      },
      {
        q: "What drives stamp duty on security documents?",
        a: "The state in which the document is executed and where the secured asset is located, the nature of the security (mortgage, hypothecation, pledge, guarantee), and whether the state offers a cap or a concessional rate for consortium lending. Andhra Pradesh, Karnataka and Telangana each treat these differently, so we map duty before drafting rather than after.",
      },
      {
        q: "Our borrower is showing signs of stress. When should we involve counsel?",
        a: "Before the account is classified, not after. Early advice preserves options — a restructuring within the RBI framework, a one-time settlement, or an assignment — several of which become unavailable or more expensive once enforcement has begun.",
      },
      {
        q: "Can you advise on an external commercial borrowing where the lender is a group company?",
        a: "Yes. Related-party ECBs are permitted within the RBI framework but carry specific conditions on recognised lender status, minimum average maturity and end-use. We assess eligibility at the structuring stage, because a facility that does not qualify cannot be regularised simply by re-papering it.",
      },
      {
        q: "What documents will you need from us to start?",
        a: "Constitutional documents and board or shareholder authorisations, the term sheet or sanction letter, details of existing borrowings and charges, title documents for any asset being secured, and the latest audited financial statements. We send a tailored checklist once we understand the structure.",
      },
      {
        q: "Do you handle enforcement in addition to documentation?",
        a: "Yes. The team handles SARFAESI measures, Debts Recovery Tribunal proceedings and insolvency applications before the NCLT, and we regularly act on enforcement of facilities another firm documented.",
      },
    ],
  },
  {
    slug: "corporate-ma",
    name: "Corporate Advisory",
    shortName: "Corporate Advisory",
    group: "Corporate",
    tagline:
      "Acquisitions, investments, joint ventures and reorganisations — structured for the regulatory reality they have to survive.",
    overview: [
      {
        heading: "The transactional landscape",
        body: [
          "Indian M&A sits at the intersection of the Companies Act, 2013, the exchange control rules that govern who may invest and on what terms, competition clearance thresholds, and — for listed targets — the SEBI takeover and insider trading regulations. A structure that is tax-efficient can be foreign-investment non-compliant; a share purchase that is quick to sign can trigger an open offer nobody priced.",
          "Sector-specific caps and approval routes under the FDI policy continue to shift, and press note conditions on investment from certain jurisdictions add a diligence step that did not exist a few years ago. For unlisted transactions, the pricing guidelines under FEMA set a floor and a ceiling the commercial negotiation has to respect.",
          "The result is that structuring is not a preliminary phase to be got through. It is where most of the value, and most of the risk, in a transaction is decided.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We advise across the transaction lifecycle: structuring and term sheets, legal due diligence, transaction documentation, regulatory approvals and filings, signing and completion mechanics, and the post-closing steps that are usually left underspecified.",
          "Our diligence reports are written to be used — issues ranked by whether they are a walk-away, a price adjustment, a condition precedent, an indemnity, or simply a matter for disclosure. On documentation we hold firm on the provisions that decide outcomes when a deal goes wrong: conditions, warranties and their qualification, indemnity caps and baskets, and the exit and deadlock machinery.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Strategic acquirers and sellers, private equity and venture capital funds, family-owned and promoter-led businesses, listed companies, and founders on both investment and exit.",
          "We act on control acquisitions, minority and growth investments, joint ventures, schemes of arrangement, group reorganisations and slump sales.",
        ],
      },
    ],
    services: [
      {
        short: "mergers & acquisitions",
        title: "Mergers and acquisitions",
        body:
          "Share and asset acquisitions, control and minority deals, competitive auctions and bilateral negotiations. We handle structuring, legal due diligence, share purchase and shareholders' agreements, escrow and deferred consideration mechanics, and completion.",
      },
      {
        short: "private equity & venture capital",
        title: "Private equity and venture capital",
        body:
          "Growth and late-stage investments, seed and Series rounds, convertible instruments, liquidation preference and anti-dilution mechanics, information and governance rights, drag and tag provisions, and secondary sales. We act for funds and for founders, and the drafting reflects which side we are on.",
      },
      {
        short: "joint ventures",
        title: "Joint ventures and strategic alliances",
        body:
          "Formation, capital and governance structure, reserved matters, deadlock resolution, non-compete and exclusivity arrangements, and exit machinery. Most of the drafting effort goes on what happens when the parties stop agreeing.",
      },
      {
        short: "restructuring & schemes",
        title: "Corporate restructuring and schemes",
        body:
          "Mergers, demergers and amalgamations under Sections 230 to 232 of the Companies Act, 2013, capital reduction, buy-backs, slump sales and business transfers, and intra-group reorganisations — including the NCLT process and creditor and shareholder meetings.",
      },
      {
        short: "foreign investment & FEMA",
        title: "Foreign investment and exchange control",
        body:
          "Entry route and sectoral cap analysis, pricing guidelines, downstream investment and indirect foreign investment computation, Form FC-GPR and FC-TRS filings, and press note conditions on investment from specified jurisdictions.",
      },
      {
        short: "competition / merger control",
        title: "Competition and merger control",
        body:
          "Assessment against the Competition Act, 2002 notification thresholds including the deal value threshold, de minimis and exemption analysis, Form I and Form II filings before the Competition Commission of India, and gun-jumping risk management between signing and clearance.",
      },
      {
        short: "corporate governance",
        title: "Corporate governance and secretarial advisory",
        body:
          "Board and committee composition, related party transaction approvals, listed company obligations under the SEBI Listing Obligations and Disclosure Requirements Regulations, insider trading codes, and directors' duties.",
      },
    ],
    matters: [
      "Advised a strategic acquirer on the acquisition of a controlling stake in a Hyderabad-based speciality chemicals manufacturer, including legal due diligence, share purchase documentation and competition clearance analysis.",
      "Acted for a private equity fund on a growth investment into a South India healthcare services platform, covering the investment agreement, governance rights and exit mechanics.",
      "Advised on the structuring of a staged foreign strategic investment into an Indian metals business, including entry route analysis and FEMA pricing compliance.",
      "Acted for founders on a Series B round, negotiating liquidation preference, anti-dilution and founder vesting provisions.",
      "Advised a listed group on a scheme of amalgamation of two wholly owned subsidiaries before the NCLT, including creditor and shareholder meeting formalities.",
      "Acted for an Indian promoter group on a joint venture with a European partner, including the shareholders' agreement, technology licence and deadlock resolution machinery.",
    ],
    forums: [
      "National Company Law Tribunal — Hyderabad, Amaravati and Bengaluru benches",
      "Competition Commission of India",
      "Securities and Exchange Board of India",
      "Reserve Bank of India and authorised dealer banks (FEMA filings)",
      "Registrar of Companies; Regional Director, Ministry of Corporate Affairs",
      "Stock exchanges — BSE and NSE",
    ],
    process: [
      {
        stage: "Structuring",
        detail:
          "Entry route, holding structure, consideration mechanics and approval map, tested against foreign investment, competition and tax constraints together. Output is a structure paper with an approval timeline.",
      },
      {
        stage: "Due diligence",
        detail:
          "Corporate, contractual, employment, litigation, property, regulatory and IP review against a scope agreed in advance. Findings are ranked by deal consequence, not by subject matter.",
      },
      {
        stage: "Documentation",
        detail:
          "Term sheet through to definitive agreements — share purchase or subscription, shareholders' agreement, escrow, disclosure letter and ancillary transfers.",
      },
      {
        stage: "Approvals and conditions",
        detail:
          "Competition, sectoral regulator and government approvals where required, third-party and lender consents, and management of the gap between signing and completion.",
      },
      {
        stage: "Completion and post-closing",
        detail:
          "Closing mechanics and deliverables, statutory filings including FC-GPR or FC-TRS, board and register updates, and the integration steps that carry a legal deadline.",
      },
    ],
    team: [],
    relatedIndustries: [
      "financial-services",
      "manufacturing",
      "technology-media-telecom",
      "startups-emerging",
    ],
    faqs: [
      {
        q: "How long does legal due diligence take?",
        a: "For a mid-market private target with an organised data room, two to four weeks to a full report, with a red-flag summary earlier if you need it for pricing. Multi-entity groups, property-heavy targets and unorganised records extend the timeline — usually at the document-gathering stage rather than the review stage.",
      },
      {
        q: "Does our transaction need Competition Commission of India approval?",
        a: "It depends on the parties' assets and turnover, whether the de minimis exemption applies, and — since the deal value threshold was introduced — on the transaction value together with the target's substantial business operations in India. We assess this at structuring, because the answer determines the signing-to-completion timetable.",
      },
      {
        q: "What is the practical difference between an asset purchase and a share purchase?",
        a: "A share purchase carries the target's history — its liabilities, litigation and non-compliance — and is usually simpler to execute. An asset purchase or slump sale lets you leave liabilities behind but requires consents, employee transfer handling and asset-by-asset transfer, and the stamp duty position differs. The right answer usually depends on what diligence finds.",
      },
      {
        q: "Can a foreign investor acquire 100 percent of an Indian company?",
        a: "In many sectors yes, under the automatic route. Others carry sectoral caps, government approval requirements, or conditions tied to the investor's jurisdiction of origin. Sectoral policy changes often enough that we verify the current position for each transaction rather than relying on precedent.",
      },
      {
        q: "How are warranties and indemnities usually handled in an Indian private deal?",
        a: "We negotiate the qualification of warranties by disclosure, caps, baskets and de minimis thresholds, survival periods split between general and fundamental or tax warranties, and security for the indemnity — usually escrow or holdback. Warranty and indemnity insurance is available in India and is worth evaluating on larger deals.",
      },
      {
        q: "Do you advise on tax structuring too?",
        a: "We advise on the legal and regulatory structure and work alongside your tax advisers on the tax analysis. Where you do not have tax advisers, we can suggest firms we work with regularly.",
      },
    ],
  },
  {
    slug: "litigation",
    name: "Litigation",
    shortName: "Litigation",
    group: "Disputes",
    tagline:
      "Civil and commercial litigation, company and insolvency proceedings, writs and appeals, before the courts and tribunals of South India.",
    overview: [
      {
        heading: "The litigation landscape",
        body: [
          "Commercial disputes in India are increasingly triaged by forum before they are triaged by merit. The Commercial Courts Act, 2015 introduced case management timelines for commercial suits above the specified value, while ordinary civil suits proceed under the Code of Civil Procedure, 1908 in the district judiciary. Specialist tribunals now decide much of what used to be general civil litigation — the NCLT for company and insolvency matters, RERA authorities for real estate, consumer commissions for consumer claims, and the writ jurisdiction of the High Courts for regulatory and administrative action.",
          "Choosing the wrong forum, or missing the procedural step that keeps a claim alive, costs more time than losing an interlocutory application. Limitation, jurisdiction and the correct cause of action are questions we resolve before drafting starts, not after a defendant raises them.",
          "In practice the early weeks of a matter matter disproportionately. Interim protection — an injunction, an attachment before judgment, the appointment of a receiver — frequently shapes the settlement range long before any final hearing, and a case built on a thin factual record rarely recovers later.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We advise on strategy before we advise on pleadings: whether the claim is worth bringing, which forum gives the best route to the relief you actually need, what interim protection is available, and what the realistic cost and timeline look like. Where a commercial settlement is the better outcome, we say so early.",
          "The team handles the full course of contentious work — pre-action notices and replies, interim applications, pleadings and evidence, cross-examination, execution of decrees, and appeals. We act on both sides, including in matters filed against clients without notice, and we run the litigation, insolvency and regulatory angles of a dispute as one brief rather than several.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Indian and international companies, banks and financial institutions, promoters and shareholders in governance and oppression disputes, infrastructure and construction parties in claims arising out of delay and variation, and individuals in significant civil and commercial matters.",
        ],
      },
    ],
    services: [
      {
        short: "civil & commercial litigation",
        title: "Civil and commercial litigation",
        body:
          "Contractual claims, recovery suits, specific performance, property and title suits, guarantee and indemnity claims, and shareholder and joint venture disputes. We handle proceedings before the commercial divisions, the district judiciary, the High Courts and — where the matter warrants it — the Supreme Court of India.",
      },
      {
        short: "interim & injunctive relief",
        title: "Interim and injunctive relief",
        body:
          "Injunctions and ex parte applications, attachment before judgment, appointment of receivers, and Order XXXIX applications under the Code of Civil Procedure, 1908 — together with the undertakings and security a court will usually require in return.",
      },
      {
        short: "company & insolvency litigation",
        title: "Company and insolvency litigation",
        body:
          "Proceedings before the NCLT and NCLAT — insolvency applications and objections under the Insolvency and Bankruptcy Code, 2016, oppression and mismanagement petitions under Sections 241 and 242 of the Companies Act, 2013, and scheme objections.",
      },
      {
        short: "writ & regulatory litigation",
        title: "Writ and regulatory litigation",
        body:
          "Writ petitions before the High Courts challenging regulatory action, licensing decisions, tender and procurement outcomes, and tax and levy demands, together with statutory appeals before sectoral appellate tribunals.",
      },
      {
        short: "execution & enforcement",
        title: "Execution and enforcement of decrees",
        body:
          "Execution proceedings under Order XXI of the Code of Civil Procedure, attachment and sale of judgment debtor assets, and coordination of parallel civil, criminal and regulatory tracks where a recovery has more than one available route.",
      },
      {
        short: "appellate litigation",
        title: "Appellate litigation",
        body:
          "First and second appeals, revision petitions, and appeals to the Supreme Court of India on special leave — with a view on the merits of an appeal given separately from the outcome below, because the two questions are not the same.",
      },
      {
        short: "consumer & real estate litigation",
        title: "Consumer and real estate litigation",
        body:
          "Allottee and consumer commission claims, proceedings before the Real Estate Regulatory Authorities and their appellate tribunals, and civil suits arising out of construction delay and possession disputes.",
      },
    ],
    matters: [
      "Represented a financial creditor in corporate insolvency resolution proceedings before the NCLT, from Section 7 admission through committee of creditors deliberations on competing resolution plans.",
      "Advised a minority shareholder group on an oppression and mismanagement petition before the NCLT, including the interim relief application.",
      "Acted for a manufacturer in a High Court writ petition challenging a state levy on captive power consumption.",
      "Represented a developer in RERA and consumer commission proceedings concerning project delivery timelines.",
      "Acted for a lender in execution proceedings to attach and sell a judgment debtor's assets following an unsatisfied decree.",
      "Represented a plaintiff in a specific performance suit over a commercial property sale agreement, including the interim injunction application.",
    ],
    forums: [
      "Supreme Court of India",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
      "Commercial Courts and the district judiciary across Telangana, Andhra Pradesh and Karnataka",
      "National Company Law Tribunal and National Company Law Appellate Tribunal",
      "Debts Recovery Tribunals; Consumer Disputes Redressal Commissions",
      "Real Estate Regulatory Authorities and Appellate Tribunals",
    ],
    process: [
      {
        stage: "Case assessment",
        detail:
          "Merits, limitation, forum and enforceability reviewed together, with a candid view on what the claim is realistically worth after costs and time. We would rather advise against a weak claim at this stage than at the hearing.",
      },
      {
        stage: "Pre-action steps",
        detail:
          "Notice and reply, evidence preservation, and pre-institution mediation where the Commercial Courts Act requires it. Where interim relief is needed, moving without delay — laches is a real defence.",
      },
      {
        stage: "Institution and interim relief",
        detail:
          "Pleadings, documents and the interim application filed together, since the first hearing is often where practical protection is won or lost.",
      },
      {
        stage: "Evidence and hearing",
        detail:
          "Witness statements and affidavits, expert evidence where quantum is contested, discovery and interrogatories, and cross-examination, tracked against the applicable case management timeline.",
      },
      {
        stage: "Judgment and after",
        detail:
          "Execution of the decree, or appeal. We advise on the cost-benefit of appeal separately from the outcome below, because the two questions are not the same.",
      },
    ],
    team: [],
    relatedIndustries: [
      "infrastructure-energy",
      "real-estate-construction",
      "financial-services",
      "public-sector",
    ],
    faqs: [
      {
        q: "How long does a civil or commercial dispute take in India?",
        a: "It varies widely by forum. A commercial suit at first instance commonly runs two to four years, though the Commercial Courts Act timelines have compressed some stages. An ordinary civil suit in the district judiciary can take longer. Appeals and execution add further time.",
      },
      {
        q: "What is the difference between an interim injunction and an attachment before judgment?",
        a: "An injunction restrains a party from doing something — disposing of an asset, continuing a disputed act — while an attachment before judgment freezes a specific asset so it remains available to satisfy a future decree. Courts grant either only on a real showing of urgency and risk, not as a matter of course.",
      },
      {
        q: "We have an unsatisfied decree. What can we actually recover?",
        a: "Execution proceedings can attach and sell the judgment debtor's assets and garnish debts owed to them. The practical constraint is usually locating assets rather than the law — we typically start with an asset search before filing.",
      },
      {
        q: "Can we get an injunction quickly?",
        a: "Urgent interim relief can be sought at the time of filing, and courts do hear genuinely urgent applications at short notice. But the threshold is real: a prima facie case, irreparable harm, balance of convenience, and clean conduct. Courts commonly require an undertaking as to damages or security as a condition.",
      },
      {
        q: "How do you charge for litigation work?",
        a: "Usually a combination of a retainer for the matter and appearance fees, or hourly rates for advisory and drafting stages. We give a written estimate at the outset broken down by stage, and flag when a development is likely to move the estimate.",
      },
      {
        q: "Do you act on the defence side as well?",
        a: "Yes. We regularly act for parties who have been sued or served with a petition, including on short notice. The same team runs both claimant and defence work, and we run a conflicts check before taking on any new instruction.",
      },
    ],
  },
  {
    slug: "dispute-resolution",
    name: "Alternative Dispute Resolution",
    shortName: "ADR",
    group: "Disputes",
    tagline:
      "Arbitration, mediation and conciliation, and the interim relief that often shapes settlement long before a hearing.",
    overview: [
      {
        heading: "The arbitration and mediation landscape",
        body: [
          "The Arbitration and Conciliation Act, 1996, as amended, is the primary statute, and recent amendments have narrowed the grounds on which awards can be challenged and limited judicial interference at the referral stage. Institutional arbitration has grown alongside ad hoc references, with the Indian Arbitration Council Hyderabad, the Mumbai Centre for International Arbitration and international institutions all seeing more work from Indian parties.",
          "The Commercial Courts Act, 2015 requires pre-institution mediation for commercial suits that do not seek urgent interim relief, which has made mediation a mandatory first step rather than an optional one for a wide band of disputes. Conciliation under the Arbitration and Conciliation Act, and private mediation, both remain available where parties would rather negotiate a settlement than litigate one out.",
          "Interim protection matters disproportionately in arbitration too. A Section 9 application, made before or during the reference, frequently secures the subject matter of the dispute — or the applicant's position — long before the tribunal is even constituted.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We advise on strategy before pleadings: whether arbitration or mediation is the better route for the relief you need, what interim protection is available, and what a realistic timeline and cost look like. Where a negotiated settlement serves the client better than an award, we say so early.",
          "The team drafts and reviews arbitration clauses, acts on Section 11 applications for appointment of arbitrators, and handles ad hoc and institutional references from constitution of the tribunal through award, enforcement and challenge. We also act in mediation and conciliation, and draft settlement terms built to be enforceable rather than merely agreed.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Indian and international companies, banks and financial institutions, construction and infrastructure parties in arbitrations over delay and variation, shareholders and joint venture partners, and individuals with a commercial dispute better resolved through negotiation than litigation.",
        ],
      },
    ],
    services: [
      {
        short: "arbitration clauses & appointment",
        title: "Arbitration clauses and appointment of arbitrators",
        body:
          "Drafting and reviewing arbitration clauses at the contract stage, Section 11 applications for appointment where parties cannot agree, and advice on seat, venue, institutional rules and governing law choices that determine how a dispute will actually be resolved.",
      },
      {
        short: "domestic & international arbitration",
        title: "Domestic and international arbitration",
        body:
          "Ad hoc and institutional references, claims and counterclaims, document and witness evidence, and hearings. We act in construction and infrastructure arbitrations, shareholder and joint venture disputes, and supply and distribution claims, under institutional rules including those of IAMC Hyderabad, the ICA, the MCIA and SIAC.",
      },
      {
        short: "interim relief in arbitration",
        title: "Interim relief in aid of arbitration",
        body:
          "Section 9 applications before or during a reference, Section 17 applications before the tribunal once constituted, and the undertakings and security a court or tribunal will usually require in return. Timing is often decisive — we move before the position the applicant needs to protect has already shifted.",
      },
      {
        short: "enforcement & challenge of awards",
        title: "Enforcement and challenge of awards",
        body:
          "Execution of domestic awards, enforcement of foreign awards under Part II of the Arbitration Act, resisting enforcement on public policy and other permitted grounds, and Section 34 challenges and Section 37 appeals.",
      },
      {
        short: "mediation & conciliation",
        title: "Mediation and conciliation",
        body:
          "Pre-institution mediation under the Commercial Courts Act, conciliation under the Arbitration and Conciliation Act, private and institutional mediation, and settlement structuring — with consent terms drafted so that they hold up if a party later has second thoughts.",
      },
      {
        short: "dispute strategy & forum selection",
        title: "Dispute strategy and forum selection",
        body:
          "An early, candid assessment of whether arbitration, mediation or negotiation gives the best route to the outcome you need, before any process begins — the forum chosen at the outset is difficult and expensive to change later.",
      },
    ],
    matters: [
      "Represented a contractor in a domestic arbitration arising out of delay and variation claims on a road project, from constitution of the tribunal to final award.",
      "Acted for a lender in Section 9 proceedings under the Arbitration and Conciliation Act to secure the subject matter of a claim pending arbitration.",
      "Advised on the drafting and negotiation of arbitration clauses for a series of cross-border supply agreements, including seat and institutional rule selection.",
      "Represented an Indian distributor resisting enforcement of a foreign arbitral award, on grounds available under Part II of the Arbitration Act.",
      "Acted for a joint venture partner in a mediated settlement of a shareholder dispute, including drafting the consent terms.",
      "Advised a manufacturer on a Section 34 challenge to a domestic award, including the limitation and procedural grounds available.",
    ],
    forums: [
      "Ad hoc arbitral tribunals and institutional arbitration under IAMC Hyderabad, ICA, MCIA and SIAC rules",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka — arbitration jurisdiction",
      "Supreme Court of India",
      "Commercial Courts — pre-institution mediation and Section 9, 34 and 37 proceedings",
      "Private and institutional mediation and conciliation centres",
    ],
    process: [
      {
        stage: "Dispute strategy",
        detail:
          "Merits, the arbitration clause where one exists, and the realistic value of the claim reviewed together, with a candid view on whether arbitration, mediation or negotiation gives the best route to what you actually need.",
      },
      {
        stage: "Constitution or referral",
        detail:
          "Appointment of the tribunal — by agreement, institutional rules or a Section 11 application — or referral to mediation or conciliation, chosen for the forum that fits the dispute rather than the default.",
      },
      {
        stage: "Interim relief",
        detail:
          "Section 9 or Section 17 applications moved without delay where the subject matter of the dispute needs protecting before the merits are heard.",
      },
      {
        stage: "Pleadings and hearing",
        detail:
          "Statements of claim and defence, document production, witness and expert evidence, and the hearing itself, run to the tribunal's procedural timetable.",
      },
      {
        stage: "Award, settlement and after",
        detail:
          "Enforcement, or a Section 34 challenge and Section 37 appeal where the award is genuinely open to one; for a mediated outcome, consent terms drafted to be enforceable on their own.",
      },
    ],
    team: [],
    relatedIndustries: [
      "infrastructure-energy",
      "real-estate-construction",
      "financial-services",
      "public-sector",
    ],
    faqs: [
      {
        q: "Is arbitration always faster and cheaper than litigation?",
        a: "Faster, often. Cheaper, not necessarily — you pay the tribunal's fees, the institution's fees and the venue, none of which arise in court. Arbitration is usually the better choice for confidentiality, for technical disputes where you want a specialist tribunal, and for cross-border enforceability. It is a poor choice if you need relief against a non-signatory.",
      },
      {
        q: "Our contract has no arbitration clause. What are our options?",
        a: "You can agree to arbitrate after a dispute arises through a separate written agreement, which is sometimes worth proposing, or proceed in the civil or commercial courts instead. We advise on which route better fits the relief you need.",
      },
      {
        q: "Can we get interim protection quickly in arbitration?",
        a: "Yes — a Section 9 application can be made even before the tribunal is constituted, and courts do hear genuinely urgent applications at short notice. The threshold is real: a prima facie case, irreparable harm, balance of convenience, and clean conduct, and an undertaking as to damages or security is commonly required.",
      },
      {
        q: "Is pre-institution mediation compulsory?",
        a: "For commercial suits under the Commercial Courts Act that do not contemplate urgent interim relief, yes — it is a precondition to filing. We assess at the outset whether your claim qualifies for the urgent-relief exception.",
      },
      {
        q: "Can a foreign award be enforced in India?",
        a: "Yes, where the award is made in a reciprocating territory notified under the Act. Enforcement is by application to the appropriate High Court, and the grounds for resisting it are narrow and do not include a rehearing on the merits. Practical timelines depend on the court and on whether enforcement is contested.",
      },
      {
        q: "How do you charge for arbitration and mediation work?",
        a: "Usually a retainer for the matter combined with hearing fees, or hourly rates for drafting and advisory stages. We give a written estimate broken down by stage at the outset — separate from the tribunal's and institution's own fees, which are not ours to quote.",
      },
    ],
  },
  {
    slug: "real-estate-infrastructure",
    name: "Real Estate & Infrastructure",
    shortName: "Real Estate",
    group: "Corporate",
    tagline:
      "Land acquisition, development structures, RERA compliance and project documentation across the Telugu states and Karnataka.",
    overview: [
      {
        heading: "The land and development framework",
        body: [
          "Real estate in India is governed state by state. Title derives from a chain of documents interpreted under local revenue law and recorded in state land records systems — Dharani in Telangana, Webland and the Andhra Pradesh Land Titling framework, and Bhoomi and Kaveri in Karnataka. Two adjoining parcels can require entirely different diligence.",
          "Layered over title are the Real Estate (Regulation and Development) Act, 2016 and the state rules made under it, municipal and development authority approvals — GHMC and HMDA, APCRDA, BBMP and BDA — building bye-laws, land ceiling and agricultural conversion rules, and environmental clearance where the project crosses threshold size.",
          "Title diligence in this sector is not a formality that precedes the deal. Encumbrances, unrecorded family partitions, tenancy claims, endowment and assigned land restrictions, and pending land acquisition proceedings are the ordinary findings, not the exceptional ones.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We run title investigation and prepare title reports, structure acquisitions and development arrangements, draft and negotiate the full documentation set — sale deeds, development and joint development agreements, agreements to sell, leases and licences, construction and consultancy contracts — and handle the registration and stamp duty position for each.",
          "On the regulatory side we advise on RERA registration and the developer obligations that follow it, layout and building plan approvals, occupancy and completion certificates, and the compliance calendar that attaches to a registered project. We also act in the disputes that arise: allottee claims, RERA proceedings, specific performance suits and construction arbitrations.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Developers and construction companies, landowners and family groups contributing land into development arrangements, institutional investors and lenders in real estate credit, corporate occupiers taking commercial space, and industrial buyers acquiring land for plants and warehouses.",
        ],
      },
    ],
    services: [
      {
        short: "title investigation",
        title: "Title investigation and due diligence",
        body:
          "Chain of title review, encumbrance certificate and revenue record searches, litigation and land acquisition checks, verification of the seller's authority and capacity, and a written title report identifying defects together with what can and cannot be cured before completion.",
      },
      {
        short: "acquisition & disposal",
        title: "Acquisition and disposal",
        body:
          "Agreements to sell, sale deeds, conveyances and gift and partition deeds, structuring for stamp duty and registration efficiency within the applicable state law, power of attorney arrangements, and completion and mutation of records.",
      },
      {
        short: "development structures",
        title: "Development structures",
        body:
          "Joint development agreements and revenue or area sharing arrangements, development management agreements, landowner and developer allocation mechanics, and the security and step-in rights that protect each side if the project stalls.",
      },
      {
        short: "RERA compliance",
        title: "RERA and project compliance",
        body:
          "Project registration, promoter disclosures, allottee agreement drafting compliant with the state rules, the separate account and withdrawal discipline, quarterly updates, extension applications, and representation in proceedings before the authority and the appellate tribunal.",
      },
      {
        short: "leasing & occupancy",
        title: "Leasing and occupancy",
        body:
          "Commercial, retail, industrial and warehousing leases, leave and licence arrangements, fit-out and rent-free periods, lock-in and exit provisions, maintenance and CAM structures, and registration and stamp duty on lease instruments.",
      },
      {
        short: "infrastructure & projects",
        title: "Infrastructure and project documentation",
        body:
          "Concession agreements and public-private partnership documentation, EPC and construction contracts, operation and maintenance contracts, land aggregation for linear projects, and right of way and easement arrangements.",
      },
      {
        short: "real estate disputes",
        title: "Real estate disputes",
        body:
          "Specific performance and injunction suits, allottee and consumer commission claims, construction and delay arbitrations, partition and inheritance disputes affecting project land, and writ petitions against acquisition or approval decisions.",
      },
    ],
    matters: [
      "Conducted title investigation and prepared the title report for a 40-acre industrial land aggregation in Telangana involving multiple landowners and agricultural conversion.",
      "Advised a developer and a landowning family on a joint development agreement for a residential project in Hyderabad, including area sharing and step-in rights.",
      "Advised on financing documentation for the development of capital city infrastructure, including the security package over project land and receivables.",
      "Acted for a corporate occupier on a long-term commercial lease of office space in Bengaluru, including fit-out, lock-in and exit provisions.",
      "Advised a promoter on RERA registration and the allottee agreement suite for a phased residential development in Andhra Pradesh.",
      "Represented a developer in RERA and consumer commission proceedings concerning project delivery timelines.",
    ],
    forums: [
      "Real Estate Regulatory Authorities of Telangana, Andhra Pradesh and Karnataka, and the Appellate Tribunals",
      "GHMC and HMDA; APCRDA; BBMP and BDA",
      "Sub-Registrar and Registration and Stamps Departments; revenue authorities under Dharani, Webland, Bhoomi and Kaveri",
      "Consumer Disputes Redressal Commissions",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
      "State Environment Impact Assessment Authorities",
    ],
    process: [
      {
        stage: "Preliminary title check",
        detail:
          "A short-form review of the core documents and encumbrance position before you commit to diligence costs or pay an advance. Often the point at which a parcel is ruled out.",
      },
      {
        stage: "Full title investigation",
        detail:
          "Chain of title over the statutory period, revenue and litigation searches, physical and record verification, and a title report with defects classified as curable or not.",
      },
      {
        stage: "Structuring and documentation",
        detail:
          "Acquisition or development structure chosen with stamp duty, registration and tax consequences priced in, followed by the transaction documents and the payment and possession milestones.",
      },
      {
        stage: "Approvals and registration",
        detail:
          "Layout and plan approvals, conversion and NOCs, RERA registration where applicable, stamp duty payment and registration before the Sub-Registrar, and mutation of records.",
      },
      {
        stage: "Project phase and handover",
        detail:
          "Construction contracts, ongoing RERA disclosures, occupancy and completion certificates, allottee conveyances, and formation and handover to the owners' association.",
      },
    ],
    team: [],
    relatedIndustries: [
      "real-estate-construction",
      "infrastructure-energy",
      "manufacturing",
      "public-sector",
    ],
    faqs: [
      {
        q: "What does a title investigation actually cover?",
        a: "The chain of ownership over the statutory period, encumbrance certificates from the Sub-Registrar, revenue records and mutation entries, pending litigation and land acquisition notifications, the seller's authority to sell, and any statutory restriction — assigned land, endowment land, ceiling surplus, or tenancy. The deliverable is a written report that says what the defects are and whether they can be cured.",
      },
      {
        q: "How long does title diligence take?",
        a: "A single parcel with clean records and a cooperative seller, one to two weeks. Aggregations across many owners, or land with family partitions and unrecorded transfers, commonly take four to eight weeks — nearly all of it spent obtaining documents rather than reviewing them.",
      },
      {
        q: "Is RERA registration required for our project?",
        a: "Generally yes where the land exceeds five hundred square metres or the project has more than eight apartments, subject to the state rules and the exemptions for renovation and repair. Phasing matters: each phase is treated as a standalone project for registration. Marketing or accepting money before registration is itself a contravention.",
      },
      {
        q: "Can a general power of attorney be used to complete a sale?",
        a: "It can, but it needs care. The instrument must be properly stamped and registered where the law requires it, must actually authorise the specific transaction, and must be verified as subsisting — a power of attorney terminates on the principal's death. Purchasers relying on a GPA transaction should expect closer diligence, not less.",
      },
      {
        q: "Who pays stamp duty and registration charges?",
        a: "By statute the liability is usually the purchaser's, but it is contractually allocable and rates differ across Telangana, Andhra Pradesh and Karnataka, as do the concessions for particular instruments. We confirm the current rate and the market value guideline for the locality before the document is finalised.",
      },
      {
        q: "We are buying agricultural land for a factory. What else is involved?",
        a: "Conversion or non-agricultural permission under the applicable state law, ceiling limit checks, verification that the land is not assigned or endowment land, layout and building approvals from the relevant authority, and environmental and pollution control clearances where the activity and size require them. The conversion step usually drives the timeline.",
      },
    ],
  },
  {
    slug: "labour-employment",
    name: "Labour & Employment",
    shortName: "Labour & Employment",
    group: "Disputes",
    tagline:
      "Workforce structuring, the new labour codes, industrial relations and the disputes that follow termination.",
    overview: [
      {
        heading: "A framework in transition",
        body: [
          "India's employment law is consolidating. Four labour codes — on wages, industrial relations, social security, and occupational safety, health and working conditions — are intended to replace a long list of central enactments. Implementation has been staged and depends on state rules being notified, so employers currently manage a mixed position: some obligations under the codes, others still under the legislation they replace.",
          "Two changes matter most in planning terms. The definition of \"wages\" for statutory contribution and gratuity purposes is being harmonised, which affects salary structuring where allowances have been used to limit contribution liability. And the industrial relations framework raises the threshold for standing orders and retrenchment approvals while formally recognising fixed-term employment.",
          "State-level compliance remains substantial regardless — shops and establishments registration, professional tax, labour welfare fund, contract labour licensing, and the sexual harassment prevention obligations that apply to every workplace above ten workers.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We advise on the employment documentation and structures that sit under a workforce: contracts and appointment letters, employee handbooks and policies, fixed-term and consultancy arrangements, non-compete and confidentiality provisions and how far they are actually enforceable in India, ESOP documentation, and secondment and cross-border deputation.",
          "On the compliance side we run diligence and audits, advise on contract labour and gig arrangements, help set up internal committees under the POSH Act, and manage the sensitive matters — investigations, disciplinary process, performance exits, retrenchment and closure, and the settlements that end them. Where a matter becomes contentious, the same team handles the tribunal work.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Employers across manufacturing, technology services, financial services, healthcare and retail — from multinational subsidiaries setting up an Indian workforce to established plants managing a unionised environment. We also advise senior executives on their own terms of appointment and exit.",
        ],
      },
    ],
    services: [
      {
        short: "contracts & policies",
        title: "Employment documentation and policy",
        body:
          "Employment contracts and appointment letters, senior executive and managing director terms, employee handbooks, leave, remote work and moonlighting policies, code of conduct, and disciplinary and grievance procedures aligned to standing orders where they apply.",
      },
      {
        short: "labour codes & compliance",
        title: "Labour code transition and compliance",
        body:
          "Gap analysis against the four codes, wage definition and salary restructuring implications for provident fund, gratuity and bonus, registration and licensing under central and state law, statutory registers and returns, and the compliance calendar.",
      },
      {
        short: "contract labour",
        title: "Contract labour and flexible workforce",
        body:
          "Principal employer obligations and licensing under the Contract Labour (Regulation and Abolition) Act, 1970, contractor agreements and indemnities, deemed employment and permanency risk, fixed-term employment, gig and platform arrangements, and independent contractor classification.",
      },
      {
        short: "industrial relations",
        title: "Industrial relations",
        body:
          "Standing orders certification, trade union recognition and negotiation, long-term settlements and wage agreements, strike, lock-out and go-slow situations, disciplinary enquiries and domestic enquiry procedure, and conciliation before the labour authorities.",
      },
      {
        short: "termination & retrenchment",
        title: "Terminations, retrenchment and closure",
        body:
          "Individual exits and performance-based separations, group retrenchment and the notice and approval requirements, plant closure and transfer of undertaking consequences, severance structuring, and settlement and release documentation.",
      },
      {
        short: "POSH & investigations",
        title: "POSH and workplace investigations",
        body:
          "Internal Committee constitution and training, policy drafting and display obligations, conducting and advising on inquiries under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013, annual reporting, and appeals.",
      },
      {
        short: "employment litigation",
        title: "Employment litigation",
        body:
          "Proceedings before Labour Courts and Industrial Tribunals, wrongful termination and reinstatement claims, provident fund and ESI assessments and appeals, gratuity and wage claims, injunctions to enforce confidentiality obligations, and writ petitions against labour authority orders.",
      },
    ],
    matters: [
      "Advised a multinational technology services company on labour code gap analysis and the provident fund and gratuity consequences of restructuring its salary components.",
      "Acted for a manufacturer in conciliation and Industrial Tribunal proceedings arising out of a wage settlement dispute with a recognised union.",
      "Advised a healthcare group on principal employer obligations and contractor documentation across three states following a contract labour audit.",
      "Constituted Internal Committees and delivered POSH training for a retail group operating across Telangana, Andhra Pradesh and Karnataka.",
      "Advised on the employment aspects of a business transfer, including transfer of service conditions and employee communication.",
      "Acted for a senior executive on exit terms, including treatment of unvested ESOPs and the enforceability of restrictive covenants.",
    ],
    forums: [
      "Labour Courts and Industrial Tribunals in Telangana, Andhra Pradesh and Karnataka",
      "Office of the Labour Commissioner and conciliation officers",
      "Employees' Provident Fund Organisation and Employees' State Insurance Corporation authorities and appellate tribunals",
      "Controlling Authority under the Payment of Gratuity Act, 1972",
      "Local Committees and appellate authorities under the POSH Act, 2013",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
    ],
    process: [
      {
        stage: "Position review",
        detail:
          "Headcount structure, entity and state footprint, existing contracts and policies, and current registrations mapped against what the applicable law requires. Output is a compliance gap list ranked by exposure.",
      },
      {
        stage: "Documentation",
        detail:
          "Contracts, policies and handbook drafted or revised, with standing orders alignment where the establishment is covered. Drafting takes account of what Indian courts will actually enforce.",
      },
      {
        stage: "Implementation",
        detail:
          "Registrations and licences, committee constitution and training, registers and returns, and manager briefing — the step most often skipped, and the one that determines whether a policy holds up in an enquiry.",
      },
      {
        stage: "Sensitive matters",
        detail:
          "Investigation, disciplinary process or exit run to a documented procedure, with the record built as the process goes rather than reconstructed afterwards.",
      },
      {
        stage: "Contentious stage",
        detail:
          "Conciliation, tribunal proceedings or writ petition, with a settlement assessment kept live throughout — most employment matters are better resolved than tried.",
      },
    ],
    team: [],
    relatedIndustries: [
      "manufacturing",
      "technology-media-telecom",
      "healthcare-life-sciences",
      "financial-services",
    ],
    faqs: [
      {
        q: "Are the four labour codes in force?",
        a: "They have been enacted, and implementation has been staged and depends on the corresponding state rules. The practical position for most employers is mixed — some obligations under the codes, others still under the earlier legislation. We advise on the current position for your specific states and establishment type rather than on the codes in the abstract.",
      },
      {
        q: "Are non-compete clauses enforceable in India?",
        a: "Post-termination non-compete restraints are generally unenforceable under Section 27 of the Indian Contract Act, 1872, which voids agreements in restraint of trade. Restrictions during employment, garden leave, and obligations protecting confidential information and trade secrets stand on much firmer ground, and non-solicitation of clients and employees is enforced more readily than a bare non-compete. We draft to the protection that will actually hold.",
      },
      {
        q: "Can we terminate an employee at will if the contract allows notice pay?",
        a: "Not straightforwardly. Whether the employee is a \"workman\" determines a great deal, as does the establishment's size and whether standing orders apply. Retrenchment carries notice, compensation and — above certain thresholds — government approval requirements. Terminations recorded as performance exits without a documented process are the ones most often reopened at a tribunal.",
      },
      {
        q: "Do POSH obligations apply to a small office?",
        a: "The Internal Committee requirement applies where an establishment has ten or more employees. But the substantive obligations — a policy, awareness, and providing a route to complain — apply regardless, and a complaint at a smaller workplace goes to the Local Committee. Annual reporting is also required.",
      },
      {
        q: "We engage workers through a contractor. What is our exposure?",
        a: "As principal employer you have registration obligations, a duty to ensure the contractor pays wages and makes statutory contributions, and secondary liability if the contractor defaults. If the contract labour arrangement is a sham — you direct and control the workers day to day — a permanency claim becomes realistic. Contractor documentation and actual practice both need to line up.",
      },
      {
        q: "How should we handle a workplace investigation?",
        a: "Appoint the right decision-maker, define the scope in writing, give the employee the allegations and a genuine opportunity to respond, keep contemporaneous records, and keep the investigator separate from the person who will decide. Procedural failures, more than factual ones, are what tribunals set aside.",
      },
    ],
  },
  {
    slug: "taxation",
    name: "Taxation",
    shortName: "Taxation",
    group: "Finance",
    tagline:
      "Direct tax, GST and transaction tax advice, with representation from assessment through appeal.",
    overview: [
      {
        heading: "The tax environment",
        body: [
          "Indian tax practice has two distinct rhythms. Direct tax is undergoing the transition to the Income-tax Act, 2025, alongside a faceless assessment and appeal process that has changed how a case is built — the written submission and the documentary record now carry weight that oral hearing once did. Indirect tax is dominated by GST, where the volume of departmental notices, input tax credit disputes and classification questions continues to grow.",
          "For cross-border structures, treaty interpretation, permanent establishment exposure, the General Anti-Avoidance Rule, place of effective management, transfer pricing and withholding on payments to non-residents all bear on the same transaction, often pulling in different directions.",
          "Tax rarely arrives as a discrete question. It surfaces inside an acquisition, a financing, a restructuring or a property transfer — which is why we prefer to be in the room at the structuring stage rather than the assessment stage.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We advise on the tax consequences of transactions and structures — acquisitions, reorganisations, financings, property transfers, and inbound and outbound investment — and on the day-to-day questions that carry real exposure: withholding on cross-border payments, GST classification and place of supply, input tax credit eligibility, and permanent establishment risk.",
          "On the contentious side we handle the full progression: responding to notices, assessment and reassessment representation, first appeals, appeals before the Income Tax Appellate Tribunal and the GST Appellate Tribunal, writ petitions where jurisdiction or natural justice is at issue, and appeals to the High Courts. We work alongside chartered accountants where compliance and certification sit with them.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Indian companies and groups, multinational subsidiaries, promoters and high net worth individuals, funds and investment vehicles, real estate and infrastructure businesses, and non-residents with Indian income or a treaty question.",
        ],
      },
    ],
    services: [
      {
        short: "transaction & structuring tax",
        title: "Transaction and structuring tax",
        body:
          "Tax analysis of acquisitions, slump sales and business transfers, amalgamations and demergers and the conditions for tax neutrality, capital gains computation and indirect transfer rules, characterisation of consideration, and stamp duty and GST interaction on transaction documents.",
      },
      {
        short: "international tax & treaties",
        title: "International tax and treaties",
        body:
          "Double taxation avoidance agreement interpretation and beneficial ownership, permanent establishment and business connection analysis, place of effective management, withholding on payments to non-residents and Section 195 certificates, royalty and fees for technical services characterisation, equalisation levy, and GAAR risk assessment.",
      },
      {
        short: "goods & services tax",
        title: "Goods and services tax",
        body:
          "Classification and rate determination, place and time of supply, input tax credit eligibility and reversal, valuation and related party supplies, reverse charge, refunds including export and inverted duty structures, e-invoicing and e-way bill compliance, and anti-profiteering.",
      },
      {
        short: "transfer pricing",
        title: "Transfer pricing",
        body:
          "Related party transaction policy and benchmarking support, documentation and master file and country-by-country reporting obligations, advance pricing agreements, safe harbour evaluation, and defence of transfer pricing adjustments in assessment and appeal.",
      },
      {
        short: "assessment & DRP",
        title: "Tax assessment and dispute resolution",
        body:
          "Response to notices under Sections 142, 143 and 148, faceless assessment representation, Dispute Resolution Panel proceedings, GST show cause notices and adjudication, and appeals through the departmental and tribunal hierarchy.",
      },
      {
        short: "tax litigation",
        title: "Tax litigation",
        body:
          "Appeals before the Commissioner (Appeals) and the Income Tax Appellate Tribunal, the GST Appellate Tribunal, writ petitions before the High Courts on jurisdiction, limitation and natural justice, and appeals to the High Courts and the Supreme Court on substantial questions of law.",
      },
      {
        short: "personal & succession tax",
        title: "Personal and succession tax",
        body:
          "Residential status and taxation of foreign income, taxation of trusts and family arrangements, gift and inheritance consequences of succession planning, capital gains on property and securities, and disclosure obligations for foreign assets.",
      },
    ],
    matters: [
      "Advised on the direct tax consequences of a scheme of amalgamation, including the conditions for tax neutrality and carry-forward of losses.",
      "Represented a manufacturer before the Income Tax Appellate Tribunal in an appeal concerning disallowance of expenditure.",
      "Advised a non-resident service provider on permanent establishment exposure and withholding on payments received from Indian customers.",
      "Acted for a technology company in GST proceedings on classification and place of supply for cross-border services.",
      "Advised a promoter family on the capital gains and stamp duty position of an intra-family transfer of property and shares.",
      "Represented a taxpayer in a High Court writ petition challenging a reassessment notice on limitation grounds.",
    ],
    forums: [
      "Income Tax Appellate Tribunal, Hyderabad and Bengaluru benches",
      "Commissioner of Income Tax (Appeals); Dispute Resolution Panel",
      "GST Appellate Tribunal; adjudicating and appellate authorities under the CGST and SGST Acts",
      "Authority for Advance Rulings and the GST Advance Ruling Authorities",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
      "Supreme Court of India",
    ],
    process: [
      {
        stage: "Position and exposure review",
        detail:
          "The transaction or issue analysed against statute, treaty and current case law, with the exposure quantified and the strength of the position stated plainly — including where it is weak.",
      },
      {
        stage: "Structuring or remediation",
        detail:
          "Where the matter is forward-looking, structuring options with the tax cost of each. Where an exposure already exists, the options for regularising it and their consequences.",
      },
      {
        stage: "Documentation and record",
        detail:
          "Contemporaneous documentation built to support the position — agreements, board records, benchmarking and valuation. Faceless assessment rewards a good written record and punishes a thin one.",
      },
      {
        stage: "Notice and assessment",
        detail:
          "Replies and submissions with supporting evidence, and management of the assessment timetable. Most cases are won or lost at this stage rather than on appeal.",
      },
      {
        stage: "Appeal",
        detail:
          "Appellate strategy including stay of demand, grounds of appeal, and a view on whether to litigate or settle taken on the numbers rather than on principle.",
      },
    ],
    team: [],
    relatedIndustries: [
      "financial-services",
      "manufacturing",
      "real-estate-construction",
      "technology-media-telecom",
    ],
    faqs: [
      {
        q: "Do you handle tax compliance and return filing?",
        a: "No. We advise on positions, structures and disputes, and appear in assessment and appellate proceedings. Return filing, audit and certification sit with chartered accountants, and we work alongside yours — or can suggest firms we deal with regularly.",
      },
      {
        q: "We have received a reassessment notice. What are the first steps?",
        a: "Check the limitation period and whether the procedural preconditions were satisfied, because a jurisdictional defect is often the strongest available answer. Then assess the substantive position and preserve the documentary record. Respond within time — a delayed reply narrows your options considerably.",
      },
      {
        q: "How long do tax appeals take?",
        a: "First appeals commonly take one to three years, and appeals before the Income Tax Appellate Tribunal a further two to four, though the position varies by bench and by the age of the matter. This is why we advise on stay of demand at the outset and give a settle-or-litigate view based on the amount at stake rather than on the merits alone.",
      },
      {
        q: "Can input tax credit be denied because our supplier did not pay GST?",
        a: "Credit eligibility depends on the statutory conditions, including that tax has actually been paid to the government, and departments do raise mismatch demands on this basis. There is a substantial body of case law on the position of a bona fide recipient. Practically, supplier verification and contractual protection are worth more than the eventual argument.",
      },
      {
        q: "Is our foreign parent's service fee subject to withholding?",
        a: "It depends on characterisation — fees for technical services, royalty, or business profits — on the treaty, on whether there is a permanent establishment or business connection, and on whether the make available test is met where the treaty contains one. It is worth resolving before the invoice is raised rather than after the payment.",
      },
      {
        q: "Does GAAR affect ordinary commercial structuring?",
        a: "GAAR targets arrangements whose main purpose is a tax benefit and which lack commercial substance, above a monetary threshold. Genuine commercial structuring with documented business rationale is not its target, but the documentation of that rationale is what carries the point. We advise on structuring and on the contemporaneous record together.",
      },
    ],
  },
  {
    slug: "intellectual-property",
    name: "Intellectual Property",
    shortName: "Intellectual Property",
    group: "Regulatory",
    tagline:
      "Trade marks, copyright, designs and trade secrets — protection, commercialisation and enforcement.",
    overview: [
      {
        heading: "The protection framework",
        body: [
          "India's intellectual property regime is statutory and registration-led for most rights: the Trade Marks Act, 1999, the Patents Act, 1970, the Copyright Act, 1957, and the Designs Act, 2000. Registry practice has moved substantially online, and examination and opposition timelines have improved, though contested matters still take years.",
          "Two features shape enforcement strategy in India. Passing off protects unregistered marks with goodwill, so a business that never registered is not without a remedy. And courts have historically been willing to grant interim injunctions in clear infringement cases — which means the early application often matters more than the eventual trial.",
          "The abolition of the Intellectual Property Appellate Board moved appeals to the High Courts, and the specialist IP divisions established at some High Courts have brought more consistent handling of contested matters.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We handle protection from the search and filing stage through prosecution and opposition — trade mark availability searches and applications, responses to examination reports, opposition and rectification, renewals, and portfolio management across classes and jurisdictions including Madrid Protocol filings.",
          "We also advise on commercialisation: assignment and licensing, franchising, technology transfer, brand and character merchandising, publishing and content agreements, and the IP provisions in employment and consultancy contracts that determine who owns what was created. And we act on enforcement — cease and desist, infringement and passing off suits, interim injunctions, customs recordation, and online and marketplace takedowns.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Consumer brands and manufacturers, pharmaceutical and life sciences businesses, technology and software companies, media, publishing and entertainment businesses, educational institutions, and founders protecting a brand at the outset.",
        ],
      },
    ],
    services: [
      {
        short: "trade marks",
        title: "Trade marks",
        body:
          "Availability and clearance searches, application filing and class selection, responses to examination reports, hearings, opposition and counter-statement, rectification and cancellation, renewals, assignment and recordal, and international filings through the Madrid Protocol.",
      },
      {
        short: "copyright & content",
        title: "Copyright and content",
        body:
          "Subsistence and ownership analysis, voluntary registration, assignment and licensing, moral rights, works made in the course of employment and commissioned works, publishing and music agreements, software licensing, and fair dealing advice.",
      },
      {
        short: "designs & patents",
        title: "Designs and patents support",
        body:
          "Design registration and infringement advice, patentability and freedom-to-operate coordination with technical agents, patent licensing and assignment, and advice on the patentability exclusions relevant to software and business methods.",
      },
      {
        short: "trade secrets",
        title: "Trade secrets and confidential information",
        body:
          "Confidentiality frameworks and NDAs, employee and contractor confidentiality obligations, technical know-how protection where patenting is not the right route, and injunctive relief where confidential information has been taken.",
      },
      {
        short: "licensing & franchising",
        title: "IP commercialisation",
        body:
          "Licensing and assignment structures and royalty mechanics, franchising and area development agreements, technology transfer, merchandising and character licensing, co-branding and sponsorship, and IP-related warranties in transaction documents.",
      },
      {
        short: "IP enforcement",
        title: "Enforcement and litigation",
        body:
          "Cease and desist correspondence, infringement and passing off suits, interim and ex parte injunctions, John Doe and search and seizure orders, damages and accounts of profits, criminal complaints for counterfeiting, and customs recordation under the IPR enforcement rules.",
      },
      {
        short: "online & marketplace",
        title: "Online and marketplace enforcement",
        body:
          "Marketplace and platform takedown notices, domain name disputes including INDRP and UDRP proceedings, social media impersonation, and coordinated action against repeat counterfeiters.",
      },
    ],
    matters: [
      "Managed a consumer brand's trade mark portfolio across multiple classes, including examination responses and two contested oppositions.",
      "Acted for a manufacturer in an infringement and passing off suit, including the interim injunction application against a deceptively similar mark.",
      "Advised a software company on ownership of code developed by contractors and remediated its consultancy agreements.",
      "Advised on a franchising structure for a regional food and beverage brand, including brand standards and territory provisions.",
      "Acted for a publisher on copyright licensing for a multi-format regional language release.",
      "Coordinated marketplace takedowns and a domain name complaint against sellers using a client's mark online.",
    ],
    forums: [
      "Trade Marks Registry, Chennai and Mumbai; Copyright Office; Designs Office",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka, including IP divisions",
      "Commercial Courts exercising IP jurisdiction",
      "Indian Computer Emergency Response Team and NIXI for INDRP domain disputes",
      "Customs authorities under the IPR (Imported Goods) Enforcement Rules",
      "Supreme Court of India",
    ],
    process: [
      {
        stage: "Search and clearance",
        detail:
          "Availability search across the register and common law use before you commit to a brand or a filing. The cheapest stage at which to discover a conflict.",
      },
      {
        stage: "Filing and prosecution",
        detail:
          "Application, class strategy, and responses to examination reports and hearings. Timelines are registry-driven; we set expectations from current practice rather than the statutory ideal.",
      },
      {
        stage: "Portfolio management",
        detail:
          "Renewals, watch and monitoring services, recordal of assignments and changes, and periodic review of whether the portfolio still matches what the business actually sells.",
      },
      {
        stage: "Commercialisation",
        detail:
          "Licensing, franchising and transfer documentation, with quality control and termination provisions that keep the right protectable.",
      },
      {
        stage: "Enforcement",
        detail:
          "Graduated response — notice, platform takedown, suit and interim injunction, or criminal complaint — chosen on the infringer's profile and the commercial harm, not reflexively.",
      },
    ],
    team: [],
    relatedIndustries: [
      "technology-media-telecom",
      "healthcare-life-sciences",
      "manufacturing",
      "startups-emerging",
    ],
    faqs: [
      {
        q: "How long does trade mark registration take in India?",
        a: "An uncontested application commonly proceeds to registration in around twelve to eighteen months, though it varies with examination and publication timelines. An opposition adds years. Rights date from the application, and use can begin before registration — the TM symbol is available from filing.",
      },
      {
        q: "Can we protect a brand we never registered?",
        a: "Yes, through a passing off action, which protects goodwill built by actual use rather than the register. It is a harder case to run because you must prove reputation and misrepresentation, which registration would have given you as a presumption. Registration remains the cheaper route by a wide margin.",
      },
      {
        q: "Who owns work created by an employee or a contractor?",
        a: "For employees, copyright in work made in the course of employment generally vests in the employer, subject to contrary agreement and to moral rights. For independent contractors the default is much less favourable to the commissioning party — ownership often stays with the creator absent a written assignment. This is the single most common IP gap we find in diligence.",
      },
      {
        q: "Is software patentable in India?",
        a: "Computer programmes per se are excluded from patentability under Section 3(k) of the Patents Act. Inventions with a demonstrable technical effect or contribution beyond the programme itself can be patentable, and claim drafting matters greatly. In practice, copyright, trade secret protection and contractual controls do most of the protective work for software businesses.",
      },
      {
        q: "Someone is selling counterfeits of our product online. What can be done quickly?",
        a: "Marketplace takedown notices are usually the fastest route and can be effective within days. For persistent or large-scale infringement, an infringement suit with an interim injunction, and in appropriate cases a search and seizure order, carries more weight. Customs recordation helps where goods are imported.",
      },
      {
        q: "Should we file internationally?",
        a: "Only where you sell, manufacture, or credibly plan to within the priority window — rights are territorial and a broad portfolio is expensive to maintain. The Madrid Protocol makes multi-country filing from an Indian base more efficient, but it is not a substitute for deciding which markets actually matter.",
      },
    ],
  },
  {
    slug: "regulatory-environmental",
    name: "Regulatory & Environmental Law",
    shortName: "Regulatory & Environmental",
    group: "Regulatory",
    tagline:
      "Consents, clearances and the conditions attached to them — and what happens when a regulator says the conditions were not met.",
    overview: [
      {
        heading: "The regulatory environment",
        body: [
          "Environmental regulation in India runs on a permission-and-condition model. The Water Act, 1974, the Air Act, 1981 and the Environment (Protection) Act, 1986 give the State Pollution Control Boards the power to consent to an operation and to attach conditions to that consent; the Environment Impact Assessment Notification, 2006 adds a prior clearance for projects above threshold size. Most disputes in this area are about a condition rather than about the permission itself.",
          "Two shifts have changed the exposure. The first is the National Green Tribunal, which since 2010 has been willing to hear environmental challenges quickly, on suo motu cognisance as well as on application, and to order interim closure. The second is the move of environmental compliance into corporate reporting — Extended Producer Responsibility under the plastic, e-waste and battery waste rules, and the BRSR disclosures listed companies now make — which turns an operating obligation into a statement a board has signed.",
          "Sector regulation sits alongside it: licensing and tariff questions before the electricity commissions, approvals under the Legal Metrology Act, 2009 and the food safety framework, consumer protection and product liability under the 2019 Act, and the administrative-law question of whether a regulator followed its own procedure before acting.",
        ],
      },
      {
        heading: "How we support you",
        body: [
          "We map the consents a project or a plant actually needs before capital is committed, take them through the State Board and the appraisal committee, and then hold the compliance calendar those conditions create. Where a consent is refused, made conditional or revoked, we appeal it — to the Appellate Authority, the NGT or the High Court, depending on what is being challenged.",
          "On the transactional side we run environmental and regulatory diligence for acquisitions and financings: whether consents are current, whether they transfer with the asset, what the last inspection found, and what a purchaser is assuming. Legacy non-compliance is frequently the item that moves an indemnity.",
          "Where an authority has issued a show cause notice, a closure direction or a demand for environmental compensation, we respond on the facts and the procedure together — a direction made without hearing is challengeable on that ground alone, and the merits usually still need answering.",
        ],
      },
      {
        heading: "Who we act for",
        body: [
          "Manufacturers and process industries, infrastructure and renewable energy developers, real estate and township projects, waste management and recycling operators, producers and brand owners carrying EPR obligations, and public sector undertakings.",
          "We also advise boards and investors on the accuracy of environmental and regulatory disclosure, which is increasingly where the question is asked first.",
        ],
      },
    ],
    services: [
      {
        short: "consents & clearances",
        title: "Consents, clearances and approvals",
        body:
          "Consent to Establish and Consent to Operate under the Water and Air Acts, prior environmental clearance under the EIA Notification, 2006, forest and wildlife clearances, coastal regulation zone approvals, and hazardous waste authorisation — including the scoping, public consultation and appraisal stages, and the conditions we expect the authority to attach.",
      },
      {
        short: "compliance & audits",
        title: "Compliance programmes and audits",
        body:
          "Building the compliance calendar a consent condition actually creates, periodic environmental compliance audits, review of monitoring and reporting obligations, and remediation plans where an audit finds a gap before an inspector does.",
      },
      {
        short: "EPR & waste rules",
        title: "Extended Producer Responsibility and waste",
        body:
          "Registration and target compliance under the Plastic Waste Management Rules, E-Waste Management Rules and Battery Waste Management Rules, producer and brand-owner classification, recycler and PRO agreements, and the record-keeping the annual return requires.",
      },
      {
        short: "NGT & enforcement defence",
        title: "Enforcement, show cause and NGT proceedings",
        body:
          "Replies to show cause notices, challenges to closure and stop-work directions, defence of environmental compensation demands, appeals to the Appellate Authority and the National Green Tribunal, and writ petitions where the challenge is to the procedure the authority followed.",
      },
      {
        short: "sector regulatory advice",
        title: "Sectoral regulatory advice",
        body:
          "Licensing, tariff and open access questions before the Central and State Electricity Regulatory Commissions, legal metrology and packaged commodity compliance, food safety licensing and labelling under the FSSAI framework, and consumer protection and product liability exposure under the 2019 Act.",
      },
      {
        short: "sustainability & disclosure",
        title: "Sustainability and disclosure",
        body:
          "Business Responsibility and Sustainability Reporting, review of environmental representations made to lenders, investors and the market, and the exposure that attaches to a claim about a product or a process that cannot be substantiated.",
      },
      {
        short: "regulatory diligence",
        title: "Regulatory diligence on transactions",
        body:
          "Consent and clearance status on an asset or share acquisition, transferability of permissions, open notices and pending proceedings, quantification of legacy liability, and the representations, indemnities and conditions precedent that follow from it.",
      },
    ],
    matters: [
      "Advised a Telangana-based process manufacturer on Consent to Operate renewal and the compliance calendar arising from the conditions attached to it.",
      "Represented a project developer before the National Green Tribunal in proceedings challenging an environmental clearance granted for an infrastructure project.",
      "Advised a brand owner on producer registration and target compliance under the Plastic Waste Management Rules, including the recycler agreements underpinning the annual return.",
      "Conducted environmental and regulatory diligence on the acquisition of a manufacturing facility in Karnataka, quantifying legacy consent and hazardous waste exposure for the indemnity package.",
      "Responded to a show cause notice and a proposed environmental compensation demand issued by a State Pollution Control Board, on both the procedural and the factual grounds.",
    ],
    forums: [
      "National Green Tribunal, Principal and Southern Benches",
      "Telangana, Andhra Pradesh and Karnataka State Pollution Control Boards",
      "Ministry of Environment, Forest and Climate Change and the State Environment Impact Assessment Authorities",
      "Central and State Electricity Regulatory Commissions",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka",
      "Supreme Court of India",
    ],
    process: [
      {
        stage: "Permission mapping",
        detail:
          "What consents, clearances and registrations the activity needs, in what order, and what each realistically takes — done before capital is committed rather than after a notice arrives.",
      },
      {
        stage: "Application and appraisal",
        detail:
          "Preparing the application and the supporting studies, taking it through scoping, public consultation and appraisal, and negotiating the conditions the authority proposes to attach.",
      },
      {
        stage: "Condition management",
        detail:
          "Converting the conditions into a compliance calendar with named owners and reporting dates, because most enforcement action begins with a condition nobody was tracking.",
      },
      {
        stage: "Audit and remediation",
        detail:
          "Periodic review against the conditions, and a remediation plan with a timeline where there is a gap — voluntarily disclosed where that improves the position.",
      },
      {
        stage: "Challenge and defence",
        detail:
          "Reply, appeal or writ, chosen on whether the real objection is to the merits or to the procedure. Interim protection is usually the first thing that matters.",
      },
    ],
    team: [],
    relatedIndustries: [
      "infrastructure-energy",
      "manufacturing",
      "real-estate-construction",
      "public-sector",
    ],
    faqs: [
      {
        q: "Does a Consent to Operate transfer with the plant when we buy it?",
        a: "Not automatically. A consent is granted to an occupier for a specified activity and capacity, and a change in occupier generally requires an application to the State Board to amend or reissue it. Treat it as a condition to be satisfied rather than an asset that arrives on completion, and check the consent's expiry and its conditions in diligence — an expired or breached consent is the seller's problem only until you own the plant.",
      },
      {
        q: "We have received a show cause notice from the Pollution Control Board. What actually matters?",
        a: "Two things at once. The facts — what the inspection found, whether the reading is disputed, what has been done since — and the procedure, meaning whether you were given a hearing and whether the Board has power to make the direction it proposes. A closure direction issued without hearing is challengeable on that ground, but the factual answer still has to be filed, and filing it late is what usually costs the interim protection.",
      },
      {
        q: "When does a project need prior environmental clearance rather than just a consent?",
        a: "When it falls within the schedule to the EIA Notification, 2006 and crosses the threshold for its category. Category A projects are appraised centrally, Category B by the State authority, and B1 projects need an impact assessment and public consultation while B2 projects do not. Expansion of an existing unit can cross a threshold the original project did not, which is a common and expensive surprise.",
      },
      {
        q: "Who carries the Extended Producer Responsibility obligation — us or our packaging supplier?",
        a: "It follows the classification. For plastic waste the obligation sits with producers, importers and brand owners, and a brand owner cannot contract out of the target by pointing at the supplier. You can discharge it through registered recyclers or a producer responsibility organisation, but the registration, the target and the annual return remain yours, and the record-keeping behind the return is what an audit tests.",
      },
    ],
  },
];

/** Fast lookup used by the dynamic route and by cross-links. */
export const practiceAreaBySlug = new Map(
  practiceAreas.map((area) => [area.slug, area]),
);

/**
 * URL segment for one service within its practice —
 * `/services/banking-finance/enforcement-and-recovery`. Derived from the
 * title, so renaming a service moves its page.
 */
export function serviceSlug(service: ServiceItem): string {
  return anchorFor(service.title);
}

/** The path to a service's own page. */
export function serviceHref(area: PracticeArea, service: ServiceItem): string {
  return `/services/${area.slug}/${serviceSlug(service)}`;
}

export function findService(
  area: PracticeArea,
  slug: string,
): ServiceItem | undefined {
  return area.services.find((service) => serviceSlug(service) === slug);
}

/** Column order for the grouped practice list on the home page. */
export const practiceGroups = ["Corporate", "Finance", "Disputes", "Regulatory"] as const;

export function practiceAreasByGroup(group: (typeof practiceGroups)[number]) {
  return practiceAreas.filter((area) => area.group === group);
}
