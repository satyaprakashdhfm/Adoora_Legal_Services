import type { Industry } from "./types";

/**
 * Industry ("domain") pages at `/domains/[slug]`. These are deliberately
 * written from the client's vantage point — what the sector's regulation and
 * transaction patterns mean for them — rather than restating the practice
 * area pages from a different angle.
 */
export const industries: Industry[] = [
  {
    slug: "financial-services",
    name: "Financial Services",
    shortName: "Financial Services",
    tagline:
      "Banks, NBFCs, funds and fintech — licensing, lending, and the compliance perimeter around each.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Financial services is the most densely regulated sector we work in, and the perimeter keeps moving. The Reserve Bank of India's scale-based regulation for non-banking financial companies has graduated NBFCs into layers with different governance, capital and disclosure obligations. The digital lending directions have reshaped how loan service providers and lending partners can contract with each other. And SEBI's regime for alternative investment funds and portfolio managers continues to tighten around disclosure and valuation.",
          "Fintech sits awkwardly across these frameworks. A single product can engage payment aggregator authorisation, the prepaid payment instrument rules, co-lending conditions, account aggregator consent architecture, and — separately — the DPDP Act. Businesses that treat these as one compliance exercise tend to be the ones that get it right.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "The work divides into three streams. There is credit — origination, security, syndication, and increasingly co-lending and securitisation. There is capital — equity investment into regulated entities, which brings change-of-control approvals and fit-and-proper assessment. And there is recovery — enforcement, restructuring and insolvency, which is where the quality of the original documentation finally gets tested.",
          "Regulatory advisory runs alongside all three, because in this sector the question is rarely whether a structure is commercially sound. It is whether the entity is permitted to do it at all.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Licensing, authorisation and change of control",
        body:
          "NBFC registration and scale-based classification, payment aggregator and prepaid instrument authorisation, account aggregator arrangements, SEBI registration for AIFs and portfolio managers, and prior approval for acquisition or transfer of control in a regulated entity.",
      },
      {
        title: "Lending, security and syndication",
        body:
          "Facility and security documentation, consortium and inter-creditor arrangements, co-lending and business correspondent structures, direct assignment and securitisation, and the perfection steps that make security enforceable.",
      },
      {
        title: "Investment into regulated entities",
        body:
          "Diligence calibrated to the regulatory perimeter rather than only the balance sheet, foreign investment route and cap analysis for the sector, fit-and-proper and regulator approval timelines, and conditions precedent built around them.",
      },
      {
        title: "Digital lending and fintech compliance",
        body:
          "Loan service provider and lending partner arrangements, key fact statements and cost disclosure, recovery and grievance obligations, data localisation for payment system data, and DPDP Act consent architecture for financial data.",
      },
      {
        title: "Stressed assets and recovery",
        body:
          "Restructuring within the RBI prudential framework, one-time settlements, assignment to asset reconstruction companies, SARFAESI measures and DRT proceedings, and insolvency applications and committee of creditors representation.",
      },
      {
        title: "Regulatory investigations and enforcement",
        body:
          "Response to RBI and SEBI inspection findings, show cause notices, settlement applications, and appeals before the Securities Appellate Tribunal and the appropriate appellate forums.",
      },
    ],
    representativeWork: [
      "Advised a non-banking financial company on its classification under the RBI's scale-based regulation and the governance changes that followed.",
      "Acted for a consortium of banks on security and inter-creditor documentation for a rupee term facility.",
      "Advised a fintech lender on its loan service provider arrangements and disclosure obligations under the digital lending directions.",
      "Acted for an asset reconstruction company on acquisition of a non-performing loan portfolio, including diligence on the underlying security.",
      "Advised an investor on the change-of-control approval pathway for the acquisition of a stake in a regulated financial entity.",
      "Represented a financial creditor through corporate insolvency resolution proceedings before the NCLT.",
    ],
    regulators: [
      "Reserve Bank of India",
      "Securities and Exchange Board of India",
      "Insurance Regulatory and Development Authority of India",
      "National Company Law Tribunal and NCLAT; Debts Recovery Tribunals",
      "Securities Appellate Tribunal",
      "Financial Intelligence Unit – India (anti-money laundering reporting)",
    ],
    team: [],
    relatedPractices: ["banking-finance", "corporate-ma", "dispute-resolution", "taxation"],
    faqs: [
      {
        q: "We are launching a lending product with a bank partner. What governs the arrangement?",
        a: "Primarily the RBI's digital lending directions and, where credit risk is shared, the co-lending framework — which between them govern disclosure of the key fact statement and all-in cost, who may collect and hold data, recovery conduct, and grievance redressal. The outsourcing directions apply to the bank's side of the arrangement, and the DPDP Act applies to both. The contract has to reflect all of these, not just the commercial split.",
      },
      {
        q: "Does acquiring a minority stake in an NBFC need RBI approval?",
        a: "Prior written approval is required for acquisition of shares resulting in a change in shareholding above the prescribed threshold, and for change of management. The threshold is lower than most investors expect, so we assess it at term sheet stage and build the approval into the conditions precedent and the timetable.",
      },
      {
        q: "Which data must be stored only in India?",
        a: "The RBI's payment system data directions require the full end-to-end transaction data of payment systems to be stored in India, with limited allowance for offshore processing subject to return and deletion. That is separate from, and stricter than, the DPDP Act's cross-border position. Product architecture decisions should be made against the sector rule, not the general one.",
      },
      {
        q: "How do you handle diligence on a regulated target?",
        a: "In addition to the usual corporate and contractual review, we assess the licence and its conditions, inspection and enforcement history, correspondence with the regulator, prudential and reporting compliance, and the fit-and-proper position of continuing management. Regulatory findings frequently drive the conditions precedent and the indemnity package more than commercial findings do.",
      },
    ],
  },
  {
    slug: "infrastructure-energy",
    name: "Infrastructure & Energy",
    shortName: "Infrastructure & Energy",
    tagline:
      "Roads, power, renewables and transmission — concessions, project finance and the claims that follow delay.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Infrastructure in India is built through a small number of contractual templates and a large amount of regulation. Concession agreements under the model documents, EPC contracts, power purchase agreements approved by the state or central electricity regulatory commission, and transmission connectivity arrangements together determine who bears which risk — land, approvals, fuel or resource availability, offtake, and change in law.",
          "The energy transition has changed the mix of work. Renewable capacity is now largely contracted through competitive bidding with tariff-based selection, which shifts negotiation from price to the bankability of the payment security mechanism and the curtailment and deviation settlement provisions. Open access, captive structures, energy storage obligations and the developing framework for green hydrogen add further layers.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Projects generate legal work in three waves. At development: land aggregation and title, approvals and clearances, concession or PPA award and the bid documentation behind it. At financing: project finance documentation, security over project assets and receivables, escrow and trust and retention accounts, and lender direct agreements. And at operation: change in law and force majeure claims, tariff and regulatory disputes, and — very commonly — construction claims for delay and variation.",
          "Because these projects are long-lived and the counterparty is often a government entity or a discom, dispute management is a continuing function rather than an event.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Concessions and public-private partnerships",
        body:
          "Bid and RFP documentation review, concession agreement negotiation, consortium and shareholding arrangements, state support and viability gap funding agreements, and termination payment and buy-out mechanics.",
      },
      {
        title: "Power purchase and offtake",
        body:
          "Power purchase agreements and tariff-based competitive bidding documentation, payment security and letter of credit mechanisms, open access and captive consumption structures, banking and wheeling arrangements, and deviation settlement and curtailment provisions.",
      },
      {
        title: "Project finance",
        body:
          "Rupee and foreign currency project debt, security over project assets, land and receivables, trust and retention account arrangements, lender direct agreements and substitution rights, refinancing, and InvIT and asset monetisation structures.",
      },
      {
        title: "Construction and EPC",
        body:
          "EPC and turnkey contracts, split contract structures, operation and maintenance agreements, performance security and liquidated damages, extension of time and variation machinery, and back-to-back subcontracting.",
      },
      {
        title: "Land, right of way and clearances",
        body:
          "Land aggregation and title investigation for linear and site-based projects, right of way and easement arrangements, land acquisition and rehabilitation issues, environmental and forest clearance, and consents to establish and operate.",
      },
      {
        title: "Regulatory and claims disputes",
        body:
          "Petitions before the state and central electricity regulatory commissions, appeals to the Appellate Tribunal for Electricity, change in law and force majeure claims, construction arbitrations on delay and variation, and enforcement of awards against public sector counterparties.",
      },
    ],
    representativeWork: [
      "Advised on the financing documentation for capital city infrastructure development, including security over project land and receivables.",
      "Acted for a renewable energy platform on ECB documentation for a foreign currency facility.",
      "Represented a contractor in arbitration on delay and variation claims arising out of a road project.",
      "Advised an industrial consumer on an open access and captive consumption structure for renewable power.",
      "Advised on land aggregation and title investigation for a linear infrastructure alignment across multiple revenue villages.",
      "Acted for a developer on EPC and O&M contract negotiation for a solar project, including performance security and liquidated damages.",
    ],
    regulators: [
      "Central Electricity Regulatory Commission; Telangana, Andhra Pradesh and Karnataka State Electricity Regulatory Commissions",
      "Appellate Tribunal for Electricity",
      "Ministry of New and Renewable Energy; Solar Energy Corporation of India",
      "National Highways Authority of India; state road development corporations",
      "State Pollution Control Boards; State and central Environment Impact Assessment Authorities",
      "APCRDA; HMDA; state industrial infrastructure corporations",
    ],
    team: [],
    relatedPractices: [
      "real-estate-infrastructure",
      "banking-finance",
      "dispute-resolution",
      "corporate-ma",
    ],
    faqs: [
      {
        q: "Our discom is delaying payment under the PPA. What are the options?",
        a: "Start with the contractual payment security — late payment surcharge, letter of credit drawdown, and any escrow or tripartite arrangement. Where that is inadequate, a petition before the relevant electricity regulatory commission is the usual route, with appeal to the Appellate Tribunal for Electricity. Regulatory recovery is generally more effective than a civil suit in this sector, and the contractual notice requirements need to be met carefully first.",
      },
      {
        q: "What is a change in law claim worth in practice?",
        a: "It depends entirely on how the concession or PPA defines change in law and the relief it provides — restitution to the same economic position, a tariff adjustment, or a lump sum. Claims stand or fall on the causal link between the legal change and the specific cost increase, and on contemporaneous documentation. Notice within the contractual period is usually a precondition, and missing it is the most common reason a good claim fails.",
      },
      {
        q: "Who bears land acquisition risk on a PPP project?",
        a: "The model concession documents typically place a specified proportion of right of way with the authority as a condition precedent, with extension of time and sometimes damages if it is not provided. In practice, partial availability is common and creates disputes about whether the project could have commenced. We advise on how the milestone and extension provisions interact before the bid is submitted, not after.",
      },
      {
        q: "Can we monetise an operating asset?",
        a: "Yes — through refinancing, a stake sale, an InvIT, or a toll-operate-transfer style arrangement, depending on the asset and what the concession permits. The concession's assignment and change-of-control provisions and the lenders' consent requirements usually determine which routes are actually available.",
      },
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing & Industrials",
    shortName: "Manufacturing",
    tagline:
      "Plants, supply chains and industrial workforces — from land and clearances to product liability.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Manufacturing carries the widest compliance surface of any sector we advise. A single plant engages industrial land and building approvals, factory licensing and safety obligations, environmental consents and hazardous waste authorisation, labour and contract labour law, product standards under BIS, GST and customs, and — for exporters — the incentive and trade remedy frameworks.",
          "Production-linked incentive schemes, state industrial policies with their own capital and power subsidies, and the pull of supply chain diversification have made greenfield and expansion work busier across Telangana, Andhra Pradesh and Karnataka. Each of those incentives is contractual as well as fiscal: the memorandum of understanding with the state, the eligibility conditions and the clawback provisions all warrant the same scrutiny as a commercial contract.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Setting up brings land, approvals, construction contracts and workforce structuring. Operating brings supply chain contracting, distribution and dealer arrangements, quality and product liability, and continuing environmental and labour compliance. Growth brings acquisitions, joint ventures with technology partners, and financing.",
          "Disputes in the sector cluster around supply and quality — non-conforming goods, delivery failure, price escalation — and around the workforce, where a unionised plant makes industrial relations a permanent legal function rather than an occasional one.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Greenfield setup and expansion",
        body:
          "Industrial land acquisition or allotment from state industrial corporations, title investigation and conversion, building and layout approvals, factory licence and safety compliance, and negotiation of state incentive memoranda including eligibility and clawback terms.",
      },
      {
        title: "Environmental and safety compliance",
        body:
          "Consent to establish and operate, environmental clearance and EIA process, hazardous and e-waste authorisation, extended producer responsibility obligations, and response to Pollution Control Board notices and closure directions.",
      },
      {
        title: "Supply chain and commercial contracting",
        body:
          "Supply and manufacturing agreements, contract and toll manufacturing, distribution, dealer and agency arrangements, procurement terms, logistics and warehousing, and the limitation of liability, indemnity and force majeure provisions that decide who absorbs disruption.",
      },
      {
        title: "Industrial workforce",
        body:
          "Standing orders and workforce structuring, contract labour compliance and principal employer exposure, union recognition and long-term settlements, disciplinary and enquiry procedure, and retrenchment, closure and transfer of undertaking.",
      },
      {
        title: "Product standards and liability",
        body:
          "BIS certification and quality control orders, labelling and legal metrology, product recall planning, consumer protection and product liability exposure, and defence of consumer commission claims.",
      },
      {
        title: "Trade, customs and incentives",
        body:
          "Customs classification and valuation, export incentive and duty drawback schemes, free trade agreement rules of origin, special economic zone and export oriented unit compliance, and anti-dumping and safeguard proceedings.",
      },
    ],
    representativeWork: [
      "Conducted title investigation for a 40-acre industrial land aggregation in Telangana, including agricultural conversion.",
      "Advised an acquirer on the purchase of a controlling stake in a speciality chemicals manufacturer, including environmental and labour diligence.",
      "Acted for a manufacturer in Industrial Tribunal proceedings arising out of a wage settlement dispute.",
      "Advised on principal employer obligations and contractor documentation following a contract labour audit across three states.",
      "Represented a manufacturer in a writ petition challenging a state levy on captive power consumption.",
      "Advised on a joint venture with a European technology partner, including the technology licence and deadlock provisions.",
    ],
    regulators: [
      "State Pollution Control Boards; Ministry of Environment, Forest and Climate Change",
      "Directorate of Factories and Boilers; Chief Inspector of Factories",
      "Bureau of Indian Standards; Legal Metrology Department",
      "Labour Commissioner; Employees' Provident Fund Organisation; ESIC",
      "Directorate General of Foreign Trade; Customs authorities; DGTR for trade remedies",
      "State industrial infrastructure corporations — TSIIC, APIIC, KIADB",
    ],
    team: [],
    relatedPractices: [
      "corporate-ma",
      "labour-employment",
      "real-estate-infrastructure",
      "taxation",
      "dispute-resolution",
    ],
    faqs: [
      {
        q: "How long does it take to get a new plant operational from a legal standpoint?",
        a: "Land and title work runs four to eight weeks for an aggregation, conversion or non-agricultural permission can take considerably longer, and environmental clearance — where the category and size require it — is usually the critical path at several months. Factory licence and consent to operate come near the end. We map the approvals as a dependency chain at the outset, because several cannot be started until an earlier one is granted.",
      },
      {
        q: "What does extended producer responsibility require of us?",
        a: "Registration on the relevant portal, collection and recycling targets tied to the quantity you place on the market, filing of returns, and — in practice — contracts with authorised recyclers or producer responsibility organisations that actually deliver auditable certificates. Enforcement has tightened, and the documentation trail is what is examined.",
      },
      {
        q: "A state has offered us capital and power subsidies. Is the MOU binding?",
        a: "It depends on how it is drafted; many are expressly non-binding as to the incentive and merely record intent. Even where enforceable, incentives carry eligibility conditions on investment quantum, employment and timelines, plus clawback if you fall short. We advise on the enforceability and on the conditions with the same care as a commercial contract, because the clawback is the part that bites.",
      },
      {
        q: "Our supplier delivered non-conforming goods and is claiming force majeure. Where do we stand?",
        a: "Start with the contract: the force majeure definition, whether the event is within it, the notice requirements, and the mitigation obligation. Indian courts have taken a fairly strict view — commercial hardship or a price rise is generally not force majeure. Then look at the quality and rejection provisions, which often give a cleaner route than the disruption argument.",
      },
    ],
  },
  {
    slug: "technology-media-telecom",
    name: "Technology, Media & Telecom",
    shortName: "TMT",
    tagline:
      "Software, platforms, content and connectivity — building products inside a fast-moving regulatory perimeter.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Technology businesses in India now operate under a genuine data protection statute. The Digital Personal Data Protection Act, 2023 introduced consent, notice, purpose limitation, security and breach notification obligations backed by meaningful penalties, and the compliance work is architectural rather than documentary — consent flows, retention logic and deletion capability have to exist in the product.",
          "Platforms carry a second layer: the Intermediary Guidelines set the conditions for safe harbour, including grievance officers, takedown timelines and, for significant social media intermediaries, additional obligations. CERT-In's six-hour incident reporting and log retention directions apply far more broadly than most companies assume. And consumer-facing digital businesses now face e-commerce rules, dark pattern guidelines and endorsement disclosure requirements.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Most of the volume is contracting: enterprise SaaS and licensing, cloud and hosting, outsourcing and delivery agreements, master services agreements and statements of work, reseller and channel arrangements, and content licensing. The negotiation almost always concentrates in the same four places — data, IP ownership, service levels and liability.",
          "Around it sits corporate work — venture and growth funding, acquisitions of product and services businesses, and ESOP structuring — and a growing regulatory advisory load as products expand into payments, lending, health data or gaming, each of which brings its own regulator.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Data protection build and governance",
        body:
          "DPDP readiness and data mapping, notice and consent architecture, data principal rights processes, retention and deletion policy, processor and sub-processor agreements, cross-border transfer analysis, and the governance record a data fiduciary must be able to produce.",
      },
      {
        title: "Enterprise technology contracting",
        body:
          "SaaS and subscription terms, software licensing, cloud and hosting, master services agreements and SOWs, systems integration and implementation, support and escrow, and the service level, IP and liability provisions on both the vendor and customer side.",
      },
      {
        title: "Platform regulation and content",
        body:
          "Intermediary due diligence and safe harbour, grievance redressal and takedown workflow, content and community policy drafting, government and law enforcement notices, and online gaming and advertising compliance.",
      },
      {
        title: "Cybersecurity and incident response",
        body:
          "CERT-In reporting and log retention compliance, security terms in vendor contracts, breach response playbooks, and live incident support including the parallel DPDP and CERT-In notification tracks.",
      },
      {
        title: "Funding, M&A and equity",
        body:
          "Seed to growth rounds, convertible instruments and preference terms, ESOP plan design and grant documentation, product and team acquisitions, and IP and code ownership diligence.",
      },
      {
        title: "Telecom and connectivity",
        body:
          "Licensing and authorisation under the Telecommunications Act, 2023, TRAI compliance, infrastructure and tower sharing, interconnection, and broadcasting and distribution arrangements.",
      },
    ],
    representativeWork: [
      "Advised a SaaS provider on DPDP readiness, including data mapping, consent architecture and revised customer data processing terms.",
      "Acted for an enterprise customer on a multi-year cloud and managed services agreement, negotiating service levels, liability and exit assistance.",
      "Advised a digital marketplace on intermediary due diligence obligations and its grievance and takedown process.",
      "Drafted a breach response playbook and advised on CERT-In reporting obligations for a technology services company.",
      "Advised a software company on ownership of contractor-developed code and remediated its consultancy agreements.",
      "Acted for a media business on content licensing and distribution for a regional streaming release.",
    ],
    regulators: [
      "Data Protection Board of India",
      "Ministry of Electronics and Information Technology; CERT-In",
      "Telecom Regulatory Authority of India; Department of Telecommunications",
      "Ministry of Information and Broadcasting",
      "Central Consumer Protection Authority",
      "Telecom Disputes Settlement and Appellate Tribunal",
    ],
    team: [],
    relatedPractices: [
      "intellectual-property",
      "corporate-ma",
      "labour-employment",
    ],
    faqs: [
      {
        q: "We are a B2B SaaS company with no Indian consumers. Does DPDP still apply?",
        a: "Very likely yes. You process employee personal data, and you almost certainly process personal data on behalf of customers — which makes you a data processor with contractual obligations flowing from your customers' fiduciary duties. Business customers are already pushing DPDP terms into vendor contracts, so the commercial pressure often arrives before the regulatory one.",
      },
      {
        q: "What IP issue comes up most often in technology diligence?",
        a: "Ownership of work done by contractors and early freelancers. Unlike employees, contractors generally retain copyright in the absence of a written assignment, and a startup that built its first version through freelancers frequently cannot show a clean chain of title. It is far cheaper to remediate before a funding round than during one.",
      },
      {
        q: "How should we handle a government content takedown notice?",
        a: "Check that it comes from an authorised officer in the prescribed form, act within the timeline the Intermediary Guidelines prescribe, and record what you did and when. Safe harbour depends on compliance with the due diligence obligations, and the record is what evidences it. Where a notice appears defective or overbroad, that is a considered legal position to take rather than an operational decision — take advice before ignoring it.",
      },
      {
        q: "Can we use customer data to train a model?",
        a: "Only if the purpose is within what you gave notice of and obtained consent for, and if your processor obligations to business customers permit it. Retrofitting consent for a new purpose is not generally available under the DPDP framework, so this needs to be designed into the notice and the contract rather than added later.",
      },
    ],
  },
  {
    slug: "real-estate-construction",
    name: "Real Estate & Construction",
    shortName: "Real Estate",
    tagline:
      "Land, development structures, RERA and delivery — for developers, landowners, investors and occupiers.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Real estate is a state-law sector with a central regulator layered on top. Title comes from local revenue and registration law and the state's land records system — Dharani, Webland, Bhoomi, Kaveri — while the Real Estate (Regulation and Development) Act, 2016 and the state rules under it govern how a project may be marketed, funded and delivered.",
          "RERA changed the economics of development, not just its paperwork. Project registration before marketing, the discipline of the separate account and withdrawal limits, mandatory quarterly disclosure, and a defined allottee remedy have shifted risk onto promoters and made delivery timelines a legal commitment rather than a marketing statement.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Development work follows a familiar sequence: title investigation, acquisition or a joint development arrangement with landowners, approvals from the municipal and development authorities, RERA registration, construction contracting, sales documentation and allottee conveyances, and handover to the owners' association.",
          "Alongside it sits investment and credit — institutional equity into projects and platforms, and real estate debt with security over land and receivables — and the leasing market, where commercial and industrial occupiers negotiate long-term arrangements. Disputes tend to be about delay, title, or partition claims from within a landowning family.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Title investigation and reporting",
        body:
          "Chain of title over the statutory period, encumbrance and revenue record searches, litigation and acquisition checks, verification of authority to sell, and a written report distinguishing curable from fatal defects.",
      },
      {
        title: "Acquisition and development structures",
        body:
          "Sale deeds and agreements to sell, joint development and revenue or area sharing agreements, development management arrangements, landowner allocation mechanics, and the step-in and security rights each side needs if the project stalls.",
      },
      {
        title: "RERA and project compliance",
        body:
          "Project and phase registration, promoter disclosures, allottee agreements compliant with the state rules, separate account and withdrawal discipline, quarterly updates and extension applications, and proceedings before the authority and appellate tribunal.",
      },
      {
        title: "Approvals and clearances",
        body:
          "Layout and building plan approvals from GHMC, HMDA, APCRDA, BBMP and BDA, agricultural conversion and land ceiling checks, environmental clearance where thresholds apply, and occupancy and completion certificates.",
      },
      {
        title: "Leasing and occupancy",
        body:
          "Commercial, retail, industrial and warehousing leases, leave and licence arrangements, fit-out and rent-free periods, lock-in, escalation and exit provisions, CAM structures, and registration and stamp duty on lease instruments.",
      },
      {
        title: "Real estate finance and investment",
        body:
          "Construction finance and lease rental discounting, security over project land and receivables, escrow arrangements, platform-level equity investment, and exit and buy-back mechanics.",
      },
    ],
    representativeWork: [
      "Advised a developer and a landowning family on a joint development agreement for a Hyderabad residential project, including area sharing and step-in rights.",
      "Conducted title investigation and prepared the title report for a multi-owner industrial land aggregation in Telangana.",
      "Advised a promoter on RERA registration and the allottee agreement suite for a phased residential development in Andhra Pradesh.",
      "Represented a developer in RERA and consumer commission proceedings concerning project delivery timelines.",
      "Acted for a corporate occupier on a long-term Bengaluru office lease, including fit-out, lock-in and exit terms.",
      "Advised on financing documentation for capital city infrastructure development, including security over project land and receivables.",
    ],
    regulators: [
      "Real Estate Regulatory Authorities of Telangana, Andhra Pradesh and Karnataka, and the Appellate Tribunals",
      "GHMC and HMDA; APCRDA; BBMP and BDA",
      "Registration and Stamps Departments and Sub-Registrar offices",
      "Revenue authorities under Dharani, Webland, Bhoomi and Kaveri",
      "State Environment Impact Assessment Authorities",
      "Consumer Disputes Redressal Commissions",
    ],
    team: [],
    relatedPractices: [
      "real-estate-infrastructure",
      "banking-finance",
      "dispute-resolution",
      "taxation",
    ],
    faqs: [
      {
        q: "What is the most common title problem you encounter?",
        a: "Unrecorded family arrangements. A partition or settlement within a family is acted on for decades without being registered or reflected in revenue records, and the person selling is not the person the records show as owner — or is one of several who should be signing. It is usually curable, but only with the cooperation of people who may be difficult to locate.",
      },
      {
        q: "Do we need separate RERA registration for each phase?",
        a: "Yes. Each phase is treated as a standalone project for registration, with its own timeline, separate account and disclosure obligations. Promoters who register phase one and market phase two on the strength of it are in contravention, and it is one of the more commonly enforced provisions.",
      },
      {
        q: "How is a joint development agreement usually structured?",
        a: "Either area sharing, where the landowner receives a defined share of the built space, or revenue sharing on sale proceeds. Area sharing gives the landowner a tangible asset and avoids arguments about sale price; revenue sharing is simpler to administer but depends on the developer's accounting. Either way, the provisions that matter are the delivery milestones, the consequences of default, and the landowner's security until their share is conveyed.",
      },
      {
        q: "Can allottees claim a refund for delay?",
        a: "Under the RERA framework an allottee can generally choose between withdrawing from the project — with a refund plus interest — and continuing while claiming interest for the period of delay. Force majeure and authority-caused delays may support an extension application, but that has to be applied for; treating delay as excused without applying is where promoters most often come unstuck.",
      },
    ],
  },
  {
    slug: "healthcare-life-sciences",
    name: "Healthcare & Life Sciences",
    shortName: "Healthcare",
    tagline:
      "Hospitals, pharmaceuticals and digital health — licensing, clinical governance and patient data.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Healthcare and pharmaceuticals sit under the Drugs and Cosmetics Act, 1940 and its rules, the New Drugs and Clinical Trials Rules, and state clinical establishment legislation, with the Central Drugs Standard Control Organisation and state drug controllers sharing oversight. Manufacturing, import, clinical trial approval, labelling and price control under the Drugs (Prices Control) Order each have their own compliance track.",
          "Service delivery adds a further layer: clinical establishment registration, biomedical waste authorisation, radiation safety approvals, PCPNDT compliance for diagnostic imaging, and professional regulation of practitioners. Digital health has brought telemedicine practice guidelines and, with the DPDP Act, express treatment of health data as a category demanding heightened care.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Consolidation drives much of the corporate work — hospital and diagnostic chain acquisitions, single-speciality roll-ups, and private equity investment into platforms — where diligence has to cover licensing, clinical governance and medical negligence exposure alongside the usual corporate ground.",
          "Operationally, the sector generates a continuous stream of contracting (doctor engagement, referral and revenue sharing arrangements that have to stay within professional conduct rules, equipment supply and service, clinical trial and CRO agreements) and of disputes (consumer commission negligence claims, drug price control demands, and regulatory action against establishments).",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Licensing and establishment compliance",
        body:
          "Clinical establishment registration, drug manufacturing and sale licences, import registration, blood bank and radiation approvals, biomedical waste authorisation, PCPNDT registration, and fire and building compliance for hospital premises.",
      },
      {
        title: "Pharmaceutical regulatory",
        body:
          "New drug and clinical trial approvals, CDSCO interaction, labelling and packaging requirements, price control under the DPCO and NPPA compliance, marketing practice codes, and recall and pharmacovigilance obligations.",
      },
      {
        title: "Healthcare M&A and investment",
        body:
          "Hospital, diagnostic and single-speciality acquisitions, private equity investment into healthcare platforms, diligence on licences, clinical governance and negligence exposure, and structuring around restrictions on the corporate practice of medicine.",
      },
      {
        title: "Clinical and commercial contracting",
        body:
          "Doctor engagement and consultancy arrangements, referral and revenue sharing structures within professional conduct rules, equipment supply and service contracts, clinical trial and CRO agreements, informed consent documentation, and hospital-insurer empanelment.",
      },
      {
        title: "Patient data and digital health",
        body:
          "DPDP compliance for health data, consent and notice design for clinical contexts, telemedicine practice guideline compliance, health record retention and access, ABDM participation, and data sharing with insurers and researchers.",
      },
      {
        title: "Medical negligence and regulatory disputes",
        body:
          "Defence of consumer commission and civil negligence claims, professional council proceedings against practitioners, NPPA overcharging demands, and writ petitions against licensing or closure action.",
      },
    ],
    representativeWork: [
      "Acted for a private equity fund on a growth investment into a South India healthcare services platform.",
      "Advised a healthcare group on principal employer obligations and contractor documentation across three states.",
      "Constituted Internal Committees and delivered POSH training for a multi-location healthcare operator.",
      "Advised a diagnostic chain on patient data handling and consent design under the DPDP framework.",
      "Advised a pharmaceutical manufacturer's lenders on the security package for a rupee term facility.",
      "Advised on doctor engagement and revenue sharing documentation consistent with professional conduct requirements.",
    ],
    regulators: [
      "Central Drugs Standard Control Organisation; state drug controllers",
      "National Pharmaceutical Pricing Authority",
      "State health departments and clinical establishment registering authorities",
      "National Medical Commission and state medical councils",
      "State Pollution Control Boards (biomedical waste); AERB (radiation safety)",
      "Data Protection Board of India; Consumer Disputes Redressal Commissions",
    ],
    team: [],
    relatedPractices: [
      "corporate-ma",
      "labour-employment",
      "intellectual-property",
      "dispute-resolution",
    ],
    faqs: [
      {
        q: "What does healthcare diligence cover beyond the usual corporate review?",
        a: "Licence and registration status for every location and every regulated activity, biomedical waste and radiation compliance, PCPNDT records where imaging is offered, the clinical governance framework, pending and threatened negligence claims and their reserving, doctor engagement terms and whether revenue sharing arrangements are compliant, and insurer empanelment terms. Licensing gaps are common and are frequently conditions precedent.",
      },
      {
        q: "How does the DPDP Act affect patient records?",
        a: "Health data is personal data and its sensitivity raises the practical standard for notice, consent, security safeguards and breach response, even though the Act does not create a separate special-category regime the way some other laws do. The harder questions in practice are retention, access by insurers and group entities, and research use — each of which needs to be within the purpose notified at collection.",
      },
      {
        q: "Are doctor revenue sharing arrangements permitted?",
        a: "Engagement of practitioners on a fee or revenue-linked basis is common and workable, but professional conduct regulations restrict fee splitting and payment for referrals. The distinction between compensating a doctor for services rendered and paying for a referral is the line that matters, and it turns on how the arrangement is structured and documented rather than on what it is called.",
      },
      {
        q: "We received an NPPA overcharging demand. What are the options?",
        a: "Verify the ceiling price applicable in the relevant period and the basis of the computation, since demands frequently rest on disputed assumptions about the formulation, pack size or period. Then consider representation before the authority and, where the demand is jurisdictionally or procedurally flawed, a writ petition. Interest accrues, so the timeline for responding matters.",
      },
    ],
  },
  {
    slug: "startups-emerging",
    name: "Startups & Emerging Business",
    shortName: "Startups",
    tagline:
      "Incorporation to exit — founder arrangements, funding rounds, ESOPs and the compliance a growing company needs.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Early-stage companies rarely have a legal problem in isolation. They have an accumulation of small decisions — how the entity was set up, what the founders agreed and whether they wrote it down, who owns the code, what was promised to early employees — that surface together at the first serious funding round or acquisition.",
          "The regulatory environment is more navigable than it used to be. Startup India recognition, the angel tax position for eligible startups, and clearer treatment of convertible instruments have removed some historic friction. What remains difficult is the interaction between foreign investment rules and the structures investors want, and the sector-specific licensing that arrives the moment a product touches payments, lending, health or education.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "The work follows the company's stage. Formation: entity choice, founder agreements with vesting, IP assignment, and the basic contract set. Funding: SAFEs and convertible notes, priced rounds and the negotiation of preference terms, governance and information rights, and the diligence that precedes them. Scale: ESOP design, employment structuring, commercial contracting and sector licensing. Exit: secondary sales, acquisition, or founder transition.",
          "The most valuable work is usually the earliest and the least dramatic — a properly drafted founder agreement and a clean IP chain are worth more at a Series A than any amount of clever negotiation on term sheet economics.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Formation and founder arrangements",
        body:
          "Entity choice and incorporation, founders' agreement with vesting and reverse vesting, roles and decision rights, IP assignment from founders and early contributors, leaver provisions, and Startup India recognition.",
      },
      {
        title: "Fundraising",
        body:
          "Term sheet review, SAFEs, convertible notes and CCPS structures, subscription and shareholders' agreements, liquidation preference, anti-dilution and pre-emption mechanics, information and board rights, and closing conditions and filings.",
      },
      {
        title: "Foreign investment compliance",
        body:
          "Entry route and sectoral cap analysis, FEMA pricing guidelines, downstream investment computation, Form FC-GPR and FC-TRS filings, and — where relevant — advice on offshore holding structures and their Indian consequences.",
      },
      {
        title: "ESOPs and team",
        body:
          "ESOP plan design and pool sizing, grant and exercise documentation, vesting and cliff structures, treatment on exit and on termination, employment and consultancy agreements, and contractor classification.",
      },
      {
        title: "IP and product",
        body:
          "Trade mark clearance and filing, code and content ownership, open source usage review, terms of use and privacy policy, DPDP-compliant consent design, and platform and intermediary obligations where applicable.",
      },
      {
        title: "Secondary sales and exit",
        body:
          "Founder and employee secondaries, buy-back and share transfer mechanics, acquisition and acqui-hire structuring, escrow and earn-out provisions, and pre-diligence cleanup of the corporate record.",
      },
    ],
    representativeWork: [
      "Acted for founders on a Series B round, negotiating liquidation preference, anti-dilution and founder vesting.",
      "Advised a SaaS provider on DPDP readiness including consent architecture and customer data processing terms.",
      "Advised a software company on ownership of contractor-developed code and remediated its consultancy agreements.",
      "Designed and documented an ESOP plan for a growth-stage technology company, including grant and exercise mechanics.",
      "Advised a fintech lender on loan service provider arrangements under the digital lending directions.",
      "Acted on trade mark clearance and filing for a consumer brand across multiple classes.",
    ],
    regulators: [
      "Registrar of Companies; Ministry of Corporate Affairs",
      "Reserve Bank of India and authorised dealer banks (FEMA filings)",
      "Department for Promotion of Industry and Internal Trade (Startup India recognition)",
      "Securities and Exchange Board of India (where AIF investors are involved)",
      "Data Protection Board of India",
      "Sector regulators — RBI for payments and lending, others as the product requires",
    ],
    team: [],
    relatedPractices: [
      "corporate-ma",
      "intellectual-property",
      "labour-employment",
    ],
    faqs: [
      {
        q: "What should be in a founders' agreement?",
        a: "Equity split and vesting with a cliff, what happens if a founder leaves — good leaver and bad leaver treatment — decision rights and deadlock, IP assignment, exclusivity and time commitment, and restrictions on transferring shares. The vesting and leaver provisions are the ones that matter, because they are the only protection the remaining founders have if someone departs early.",
      },
      {
        q: "SAFE, convertible note, or a priced round?",
        a: "SAFEs and notes are faster and cheaper and defer valuation, which suits genuinely early rounds. In India, structuring matters: instruments taken from a foreign investor must fit the FEMA framework, which is why compulsorily convertible preference shares or debentures are often used where a US-style SAFE would be. A priced round makes sense once the valuation can be supported and the cap table needs certainty.",
      },
      {
        q: "How large should the ESOP pool be?",
        a: "Commonly ten to fifteen percent at early stages, though the right answer depends on how many senior hires you need before the next round and what the market rate for those roles is in equity terms. Investors will usually require the pool to be created or topped up pre-money, so it dilutes founders rather than the incoming round — worth modelling before you agree the term sheet.",
      },
      {
        q: "What gets found in a first serious diligence exercise?",
        a: "Most often: missing IP assignments from early contractors, equity promised informally and never documented, ESOP grants made without a compliant plan, delayed statutory filings and unheld board meetings, and employment terms that misclassify contractors. None of these is fatal, but all of them take time to fix at exactly the moment you do not have time.",
      },
    ],
  },
  {
    slug: "public-sector",
    name: "Public Sector & Government",
    shortName: "Public Sector",
    tagline:
      "Procurement, concessions and regulatory engagement with state and central government entities.",
    overview: [
      {
        heading: "Industry context",
        body: [
          "Contracting with government in India differs from private contracting in ways that are easy to underestimate. Procurement is governed by tender conditions and the General Financial Rules rather than by freely negotiated terms; the authority's discretion is subject to administrative law review, which makes the writ jurisdiction a live remedy; and the counterparty's obligations are constrained by its own sanction and budgetary processes.",
          "Bid challenges illustrate the point. Courts review tender decisions for arbitrariness, mala fides and breach of the tender's own conditions rather than reassessing commercial merit, and they are conscious of the public interest in not stalling projects. The practical consequence is that timing and the documentary record decide most bid disputes.",
        ],
      },
      {
        heading: "Transaction patterns",
        body: [
          "Work with government entities clusters around procurement and bidding, concession and PPP documentation, state incentive and land allotment arrangements, regulatory engagement and representations, and disputes — arbitration under contract clauses, and writ petitions where an administrative decision is at issue.",
          "Enforcement against a public sector counterparty raises its own questions, from recovering an arbitral award to navigating the approval chain that any settlement has to pass through.",
        ],
      },
    ],
    commonMatters: [
      {
        title: "Procurement and bidding",
        body:
          "Tender and RFP condition review, eligibility and consortium structuring, bid security and clarification strategy, conflict and disqualification analysis, and pre-bid representations to the authority.",
      },
      {
        title: "Bid challenges and administrative review",
        body:
          "Writ petitions challenging tender conditions, technical disqualification or award, and defence of an award against challenge — with early advice on the narrow scope of review and on whether the timing supports intervention.",
      },
      {
        title: "Concessions and PPP",
        body:
          "Concession agreement negotiation within model document constraints, state support and viability gap funding arrangements, land and right of way conditions precedent, termination payment mechanics, and change in law protection.",
      },
      {
        title: "Land allotment and incentives",
        body:
          "Allotment from state industrial infrastructure corporations, memoranda of understanding for capital, power and employment-linked incentives, eligibility conditions and clawback, and disputes over allotment cancellation.",
      },
      {
        title: "Regulatory engagement",
        body:
          "Representations and consultation responses to regulators and ministries, applications for approvals and exemptions, policy submissions, and responses to show cause notices and audit observations.",
      },
      {
        title: "Disputes with public entities",
        body:
          "Arbitration under contract clauses, conciliation and settlement through the authority's internal mechanisms, enforcement of awards and decrees against government entities, and writ proceedings on administrative decisions.",
      },
    ],
    representativeWork: [
      "Advised on financing arrangements for capital city infrastructure development involving a state development authority and an infrastructure financing institution.",
      "Represented a contractor in arbitration against a public sector authority on delay and variation claims.",
      "Advised a bidder on consortium structuring and eligibility for an infrastructure tender.",
      "Represented a manufacturer in a writ petition challenging a state levy on captive power consumption.",
      "Advised on state incentive memorandum terms, including eligibility conditions and clawback exposure.",
      "Advised an industrial allottee on a dispute concerning cancellation of a land allotment.",
    ],
    regulators: [
      "State industrial infrastructure corporations — TSIIC, APIIC, KIADB",
      "APCRDA; HMDA; municipal corporations",
      "State and central electricity regulatory commissions",
      "National Highways Authority of India; state road development corporations",
      "High Court of Telangana; High Court of Andhra Pradesh; High Court of Karnataka (writ jurisdiction)",
      "Arbitral tribunals constituted under government contracts",
    ],
    team: [],
    relatedPractices: [
      "dispute-resolution",
      "real-estate-infrastructure",
      "banking-finance",
      "corporate-ma",
    ],
    faqs: [
      {
        q: "Can we challenge a tender condition we consider unfair?",
        a: "You can, by writ petition, but the scope of review is narrow. Courts do not substitute their commercial judgment for the authority's and generally defer to the authority's right to set its own eligibility criteria. A challenge succeeds where the condition is arbitrary, tailored to favour a particular bidder, or inconsistent with the tender's own terms. Timing is critical — a challenge brought before bid submission is treated very differently from one brought after the award.",
      },
      {
        q: "How long does enforcement of an award against a government entity take?",
        a: "Longer than against a private party, and the delay is usually structural rather than legal — internal sanction, budget provision and approval chains all have to be worked through, and appeals are common. We advise on execution alongside a parallel engagement with the authority's own settlement mechanism, because the negotiated route is often quicker even after a favourable award.",
      },
      {
        q: "What should we check before signing a state incentive MOU?",
        a: "Whether the incentive is legally committed or merely stated as intent, the eligibility conditions on investment, employment and timelines, the disbursement mechanism and who must certify it, and the clawback provisions. Also whether the incentive survives a change of policy, since several state schemes reserve the right to revise. The clawback is where the risk actually sits.",
      },
      {
        q: "Is arbitration with a government counterparty worth pursuing?",
        a: "Frequently yes, and many government contracts require it. The realistic expectation is that a favourable award will be challenged under Section 34 and that enforcement will take time. That argues for a strong contemporaneous record during the contract, careful compliance with notice provisions, and a settlement assessment kept live throughout — not for avoiding the process.",
      },
    ],
  },
];

/** Fast lookup used by the dynamic route and by cross-links. */
export const industryBySlug = new Map(
  industries.map((industry) => [industry.slug, industry]),
);
