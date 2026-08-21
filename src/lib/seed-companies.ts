import type { Company } from "./types";

// Company guides, loaded into Postgres by `pnpm db:seed`. The seven curated
// entries come first (they carry the problems tagged so far); the rest is a
// directory, ordered by name, for companies without questions attached yet.

export const companies: Company[] = ([] = [
  {
    slug: "google",
    name: "Google",
    blurb:
      "Algorithm-heavy loops with a high bar for code quality and complexity analysis. Googleyness rounds probe collaboration and comfort with ambiguity.",
    process: [
      "Recruiter screen",
      "Phone screen: one 45-minute coding interview",
      "Onsite: 3-4 coding rounds plus system design (level-dependent)",
      "Googleyness & leadership round",
      "Hiring committee review",
    ],
  },
  {
    slug: "amazon",
    name: "Amazon",
    blurb:
      "Every interview weaves in the Leadership Principles — expect a behavioral question in each round, with follow-ups that dig for data and ownership.",
    process: [
      "Recruiter screen",
      "Online assessment: two coding problems plus a work simulation",
      "Phone screen",
      "Onsite loop: 4-5 rounds pairing coding or design with Leadership Principles",
      "Bar raiser round",
    ],
  },
  {
    slug: "meta",
    name: "Meta",
    blurb:
      "Fast-paced coding rounds — two problems in 45 minutes is common — plus a product-minded design round and a dedicated behavioral round.",
    process: [
      "Recruiter screen",
      "Phone screen: 1-2 coding problems",
      "Onsite: two coding rounds",
      "System or product design round",
      "Behavioral round",
    ],
  },
  {
    slug: "stripe",
    name: "Stripe",
    blurb:
      "Practical over puzzle: expect to write working code in a real editor, debug an unfamiliar codebase, and design APIs with careful edge-case handling.",
    process: [
      "Recruiter screen",
      "Phone screen: practical coding",
      "Onsite: coding round plus a bug squash in a real codebase",
      "Integration / API design round",
      "Hiring manager conversation",
    ],
  },
  {
    slug: "netflix",
    name: "Netflix",
    blurb:
      "Senior-leaning loops that weigh judgment and culture heavily — expect deep dives on past architecture decisions alongside coding.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding plus architecture deep dives",
      "Culture conversation",
      "Team matching",
    ],
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    blurb:
      "Product-minded loops with practical coding rounds — string and array manipulation with fiddly edge cases shows up often, and design rounds stay grounded in surfaces like feeds and boards.",
    process: [
      "Recruiter screen",
      "Technical phone screen: one coding problem",
      "Onsite: two coding rounds",
      "System design round",
      "Behavioral / cross-functional round",
    ],
  },
  {
    slug: "chime",
    name: "Chime",
    blurb:
      "Consumer fintech loops that stay close to the product: practical data-structure rounds over state that changes as users move through an app, a design round grounded in money movement, and a values round built on the member-first framing used throughout the company.",
    process: [
      "Recruiter screen",
      "Technical phone screen: one coding problem",
      "Onsite: two coding rounds",
      "System design round",
      "Values and behavioral round with the hiring manager",
    ],
  },
  {
    slug: "adobe",
    name: "Adobe",
    blurb:
      "Product-engineering loops with a practical bent: data structures first, then a design round grounded in the app surface you would actually work on.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral round",
    ],
  },
  {
    slug: "affirm",
    name: "Affirm",
    blurb:
      "Lending-flavored loops: practical coding, a design round on payments and risk, plus a behavioral round.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "airbnb",
    name: "Airbnb",
    blurb:
      "Loops with unusual weight on collaboration: a pairing-style coding round, an architecture round, and a dedicated core-values interview.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: pairing-style coding round",
      "Architecture round",
      "Two core-values interviews",
    ],
  },
  {
    slug: "airwallex",
    name: "Airwallex",
    blurb:
      "Global-payments loops pairing coding rounds with design questions about multi-currency ledgers and regional rails.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "amd",
    name: "AMD",
    blurb:
      "Hardware-adjacent loops built on C and systems fundamentals, plus performance-oriented design questions that vary by team.",
    process: [
      "Recruiter screen",
      "Technical phone screen: C and systems fundamentals",
      "Onsite: coding, memory, and concurrency rounds",
      "Team-specific domain round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "anduril",
    name: "Anduril",
    blurb:
      "Defense-technology loops with systems depth — C++ or Rust rounds, real-time constraints, and questions about software that has to work in the field.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two systems coding rounds",
      "Architecture round on real-time constraints",
      "Mission and team conversation",
    ],
  },
  {
    slug: "apollo-io",
    name: "Apollo.io",
    blurb:
      "Go-to-market SaaS loops with practical coding and design questions about data enrichment and outbound workflows.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "apple",
    name: "Apple",
    blurb:
      "Deeply team-specific loops — questions follow the domain of the team you interview with, and debugging instincts and low-level detail carry real weight.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Technical phone screen",
      "Onsite: four to six team-specific rounds",
      "Cross-functional round with a partner team",
    ],
  },
  {
    slug: "applied-intuition",
    name: "Applied Intuition",
    blurb:
      "Autonomy-tooling loops with strong C++ or Python rounds, simulation-flavored design questions, and domain conversations.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Simulation and tooling design round",
      "Domain and hiring-manager round",
    ],
  },
  {
    slug: "aqr",
    name: "AQR",
    blurb:
      "Research-oriented loops pairing statistics and probability with coding, plus discussion of how models fail in practice.",
    process: [
      "Recruiter screen",
      "Online assessment: quantitative and coding",
      "Technical phone screen",
      "Onsite: research, statistics, and coding rounds",
      "Final round with the research group",
    ],
  },
  {
    slug: "arcesium",
    name: "Arcesium",
    blurb:
      "Financial-technology loops with a heavy data-modeling component — algorithms, SQL, and design questions about post-trade systems.",
    process: [
      "Recruiter screen",
      "Online assessment: coding and SQL",
      "Technical phone screen",
      "Onsite: algorithms and data-modeling rounds",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "asana",
    name: "Asana",
    blurb:
      "Collaborative loops with practical coding, a design round on real-time collaboration, and real emphasis on how you work with other people.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on real-time collaboration",
      "Collaboration and values round",
    ],
  },
  {
    slug: "atlassian",
    name: "Atlassian",
    blurb:
      "Values-forward loops — coding and design rounds plus a dedicated values interview that carries real weight in the decision.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding round",
      "System design round",
      "Values interview",
    ],
  },
  {
    slug: "attentive",
    name: "Attentive",
    blurb:
      "Messaging-platform loops — practical coding plus design questions about high-volume sends, opt-ins, and deliverability.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "avalara",
    name: "Avalara",
    blurb:
      "Tax-compliance SaaS loops: practical coding plus design questions about rules engines, rate data, and correctness at scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding exercise",
      "Onsite: system design round",
      "Hiring-manager and values round",
    ],
  },
  {
    slug: "bitgo",
    name: "BitGo",
    blurb:
      "Custody-focused loops where security reasoning matters as much as code — key management, threat modeling, and distributed systems.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and security-reasoning rounds",
      "Architecture round on custody and key management",
      "Behavioral round",
    ],
  },
  {
    slug: "blackstone",
    name: "Blackstone",
    blurb:
      "Technology loops inside a finance-first culture — algorithms and design rounds plus conversations about working directly with business stakeholders.",
    process: [
      "Recruiter screen",
      "Technical assessment",
      "Technical phone screen",
      "Onsite: coding and design rounds",
      "Stakeholder and fit conversation",
    ],
  },
  {
    slug: "block",
    name: "Block",
    blurb:
      "Practical loops across the Square and Cash App surfaces — real code, product-minded design rounds, and a values conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: practical coding round",
      "System design round",
      "Values and craft conversation",
    ],
  },
  {
    slug: "bloomberg",
    name: "Bloomberg",
    blurb:
      "Practical loops with a strong C++ and data-structures core, then a design round and questions about handling real-time market data.",
    process: [
      "Recruiter screen",
      "Technical phone screen: data structures",
      "Onsite: two coding rounds",
      "System design round",
      "Team-fit conversation",
    ],
  },
  {
    slug: "box",
    name: "Box",
    blurb:
      "Cloud-content loops: standard coding rounds plus design questions about storage, permissions, and enterprise integrations.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "brex",
    name: "Brex",
    blurb:
      "Fast, practical fintech loops — a coding exercise close to real work, a design round on card and ledger systems, and a hiring-manager conversation.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "System design round on ledgers and cards",
      "Values and collaboration round",
    ],
  },
  {
    slug: "bridgewater",
    name: "Bridgewater",
    blurb:
      "Loops that probe reasoning and self-awareness as hard as technical skill — expect direct feedback in the room and questions about how you actually think.",
    process: [
      "Recruiter screen",
      "Online assessments: aptitude and personality",
      "Phone screen with the hiring team",
      "Onsite: technical and case rounds",
      "Culture and principles conversation",
    ],
  },
  {
    slug: "bytedance",
    name: "ByteDance",
    blurb:
      "Multi-round algorithm-heavy loops — typically several coding interviews in sequence, followed by design and HR rounds.",
    process: [
      "Recruiter screen",
      "Online assessment",
      "Two to three technical rounds of algorithms",
      "System design round",
      "HR round",
    ],
  },
  {
    slug: "circle",
    name: "Circle",
    blurb:
      "Stablecoin-infrastructure loops — coding rounds plus design questions about ledgers, settlement, and blockchain integration.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "citadel",
    name: "Citadel",
    blurb:
      "Rigorous quantitative loops — algorithms with tight complexity expectations, probability, and questions about how your systems behave under latency and load.",
    process: [
      "Recruiter screen",
      "Online assessment: timed coding",
      "Technical phone screen",
      "Onsite: algorithms, probability, and systems rounds",
      "Final round with the desk or team",
    ],
  },
  {
    slug: "coinbase",
    name: "Coinbase",
    blurb:
      "Crypto-native loops: coding rounds, a design round on custody, ledgers, or exchange infrastructure, plus a values interview.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on ledgers or custody",
      "Values interview",
    ],
  },
  {
    slug: "confluent",
    name: "Confluent",
    blurb:
      "Streaming-infrastructure loops: algorithms plus deep design questions about logs, partitions, and delivery guarantees.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and distributed-systems rounds",
      "Architecture deep dive",
      "Behavioral round",
    ],
  },
  {
    slug: "credit-karma",
    name: "Credit Karma",
    blurb:
      "Consumer-finance loops with practical coding rounds and design questions about recommendations and personal-finance data.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "crowdstrike",
    name: "CrowdStrike",
    blurb:
      "Security loops pairing systems coding with threat-detection reasoning and design questions about telemetry at scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and security-reasoning rounds",
      "Architecture and threat-modeling round",
      "Behavioral round",
    ],
  },
  {
    slug: "ctc",
    name: "CTC",
    blurb:
      "Trading loops that combine timed math assessments with algorithms and conversations about market intuition.",
    process: [
      "Recruiter screen",
      "Timed math and logic assessment",
      "Technical phone screen",
      "Onsite: algorithms and trading-game rounds",
      "Final round with traders",
    ],
  },
  {
    slug: "databricks",
    name: "Databricks",
    blurb:
      "Systems-heavy loops — strong algorithms, distributed data-processing questions, and design rounds about query and storage layers.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two algorithm rounds",
      "Distributed-systems design round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "datadog",
    name: "Datadog",
    blurb:
      "Observability loops with practical coding, a design round on high-volume metrics ingestion, and a systems conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and distributed-systems rounds",
      "Architecture deep dive",
      "Behavioral round",
    ],
  },
  {
    slug: "de-shaw",
    name: "DE Shaw",
    blurb:
      "Analytically demanding loops — probability, combinatorics, and algorithms, with a clear preference for candidates who reason precisely under pressure.",
    process: [
      "Recruiter screen",
      "Online assessment: math and coding",
      "Phone screen: probability and algorithms",
      "Onsite: multiple quantitative and coding rounds",
      "Final round with the group you would join",
    ],
  },
  {
    slug: "docusign",
    name: "DocuSign",
    blurb:
      "Enterprise-SaaS loops with standard coding rounds and design questions about documents, signatures, and audit trails.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding exercise",
      "Onsite: system design round",
      "Hiring-manager and values round",
    ],
  },
  {
    slug: "doordash",
    name: "DoorDash",
    blurb:
      "Marketplace loops — coding rounds, a design round on logistics and real-time dispatch, and a behavioral round.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "dropbox",
    name: "Dropbox",
    blurb:
      "Loops that favor clean, working code over cleverness, with design rounds about storage, sync, and sharing.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "drw",
    name: "DRW",
    blurb:
      "Quantitative loops that mix low-latency systems questions with probability and algorithms, tuned to the desk you would support.",
    process: [
      "Recruiter screen",
      "Online assessment: timed coding",
      "Technical phone screen",
      "Onsite: algorithms, systems, and probability rounds",
      "Final round with traders and engineers",
    ],
  },
  {
    slug: "duolingo",
    name: "Duolingo",
    blurb:
      "Learning-product loops that pair practical coding with product sense and design questions about lessons and experimentation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral and culture round",
    ],
  },
  {
    slug: "ea",
    name: "EA",
    blurb:
      "Games loops tuned to the discipline — C++ and engine questions for gameplay roles, services design for online teams.",
    process: [
      "Recruiter screen",
      "Technical phone screen: C++ fundamentals",
      "Onsite: gameplay or services coding rounds",
      "Design round for your discipline",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "earnin",
    name: "EarnIn",
    blurb:
      "Consumer-fintech loops with practical coding and design questions about earnings data, risk, and payout timing.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "ebay",
    name: "eBay",
    blurb:
      "Marketplace loops with standard coding rounds and design questions about catalogs, search, and payments.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "faire",
    name: "Faire",
    blurb:
      "Wholesale-marketplace loops: practical coding, a design round on catalog and ordering, plus a hiring-manager conversation.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "flexport",
    name: "Flexport",
    blurb:
      "Logistics loops with practical coding and design questions about shipments, tracking, and genuinely messy real-world data.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    blurb:
      "Structured loops with a technical assessment, algorithm rounds, and a superday of back-to-back interviews spanning code and behavior.",
    process: [
      "Recruiter screen",
      "HackerRank-style technical assessment",
      "Recorded or live phone interview",
      "Superday: several back-to-back technical rounds",
      "Behavioral and fit round",
    ],
  },
  {
    slug: "grammarly",
    name: "Grammarly",
    blurb:
      "NLP-adjacent loops pairing algorithms with design questions about latency-sensitive suggestions across every editor they plug into.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on latency-sensitive NLP serving",
      "Behavioral round",
    ],
  },
  {
    slug: "gsa-capital",
    name: "GSA Capital",
    blurb:
      "Quantitative research loops — statistics, probability, and coding, with follow-ups that dig into how you would test a signal.",
    process: [
      "Recruiter screen",
      "Online assessment: quantitative reasoning",
      "Technical phone screen: statistics and coding",
      "Onsite: research and coding rounds",
      "Final round with researchers",
    ],
  },
  {
    slug: "gusto",
    name: "Gusto",
    blurb:
      "Payroll-and-benefits loops with practical coding, a design round on money movement and compliance, plus a values conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding round",
      "Design round on payroll and compliance",
      "Values and collaboration round",
    ],
  },
  {
    slug: "highspot",
    name: "Highspot",
    blurb:
      "Enterprise-SaaS loops pairing practical coding with design questions about search, content, and integrations.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "hudson-river-trading",
    name: "Hudson River Trading",
    blurb:
      "Algorithms and systems at speed — deep C++ or Python rounds, performance questions, and probability puzzles.",
    process: [
      "Recruiter screen",
      "Online assessment: algorithms",
      "Technical phone screen",
      "Onsite: algorithms, systems, and probability rounds",
      "Final round with engineers and traders",
    ],
  },
  {
    slug: "imc",
    name: "IMC",
    blurb:
      "Trading-firm loops with a timed math and logic assessment up front, then probability, algorithms, and rounds with traders.",
    process: [
      "Recruiter screen",
      "Timed math and logic assessment",
      "Technical phone screen",
      "Onsite: probability, algorithms, and trading games",
      "Final round with traders",
    ],
  },
  {
    slug: "instacart",
    name: "Instacart",
    blurb:
      "Marketplace and logistics loops: practical coding, a design round on catalog and fulfillment, plus a behavioral round.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "jane-street",
    name: "Jane Street",
    blurb:
      "Probability, mental math, and market-making games matter as much as code — you are graded on the reasoning you say out loud, not the answer you land on.",
    process: [
      "Recruiter screen",
      "Phone screen: probability and estimation",
      "Technical phone screen: coding and reasoning",
      "Onsite: probability, trading games, and programming rounds",
      "Final conversations with traders and engineers",
    ],
  },
  {
    slug: "jump-trading",
    name: "Jump Trading",
    blurb:
      "Low-latency engineering loops: C++ and systems depth, cache and concurrency questions, plus probability and algorithms.",
    process: [
      "Recruiter screen",
      "Online assessment: timed coding",
      "Technical phone screen: systems and C++",
      "Onsite: performance, concurrency, and algorithm rounds",
      "Final round with the team",
    ],
  },
  {
    slug: "linkedin",
    name: "LinkedIn",
    blurb:
      "Loops that pair standard coding rounds with a strong host and behavioral component, plus design questions grounded in feeds, graphs, and search.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round",
      "Host round on values and collaboration",
    ],
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    blurb:
      "Loops that lean on practical engineering judgment — clean code, testing, and how you handle ambiguity matter as much as finding the optimal algorithm.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: three to four coding and design rounds",
      "System design round for senior roles",
      "As-appropriate round with a senior leader",
    ],
  },
  {
    slug: "millennium",
    name: "Millennium",
    blurb:
      "Platform-oriented loops where engineering rounds are tailored to the pod or desk you would support, alongside quantitative reasoning.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: algorithms and systems rounds",
      "Quantitative reasoning round",
      "Final round with the pod you would join",
    ],
  },
  {
    slug: "miro",
    name: "Miro",
    blurb:
      "Collaboration-canvas loops: practical coding plus design questions about real-time sync and conflict resolution.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "mixpanel",
    name: "Mixpanel",
    blurb:
      "Analytics loops: coding rounds plus design questions about event ingestion, funnels, and fast queries over very large datasets.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on analytics at scale",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "moloco",
    name: "Moloco",
    blurb:
      "Ad-ML loops where algorithms meet real-time serving — coding rounds plus design questions about bidding and model latency.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two algorithm rounds",
      "Design round on real-time ML serving",
      "Behavioral round",
    ],
  },
  {
    slug: "mongodb",
    name: "MongoDB",
    blurb:
      "Database loops where storage engines, indexing, and consistency questions sit alongside standard coding rounds.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and data-structures rounds",
      "Design round on storage and indexing",
      "Behavioral round",
    ],
  },
  {
    slug: "moveworks",
    name: "Moveworks",
    blurb:
      "Enterprise-AI loops pairing coding rounds with design questions about retrieval, agents, and integrating with a company's existing systems.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on retrieval and integrations",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "nextdoor",
    name: "Nextdoor",
    blurb:
      "Local-network loops: coding rounds plus design questions about feeds, moderation, and geographic partitioning.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral and culture round",
    ],
  },
  {
    slug: "niantic",
    name: "Niantic",
    blurb:
      "AR-platform loops: coding rounds plus design questions about location data, mapping, and mobile clients at scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on location and mapping data",
      "Behavioral round",
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    blurb:
      "Craft-focused loops — a practical coding exercise close to real product work, a design round, and conversations about taste and product sense.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "nuro",
    name: "Nuro",
    blurb:
      "Autonomy loops where algorithms meet robotics constraints — coding rounds, a systems round, and safety-oriented discussion.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Systems and safety design round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "nvidia",
    name: "Nvidia",
    blurb:
      "Systems-flavored loops where memory hierarchy, parallelism, and performance questions show up next to standard algorithms, tuned to the team.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding plus architecture and performance rounds",
      "Team-specific domain round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "okta",
    name: "Okta",
    blurb:
      "Identity loops: coding rounds plus design questions about authentication, tokens, and multi-tenant access control.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on identity and access control",
      "Behavioral round",
    ],
  },
  {
    slug: "okx",
    name: "OKX",
    blurb:
      "Exchange loops with algorithm rounds and design questions about matching engines, latency, and wallet infrastructure.",
    process: [
      "Recruiter screen",
      "Online assessment: algorithms",
      "Technical phone screen",
      "Onsite: algorithms and exchange-systems design",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "openai",
    name: "OpenAI",
    blurb:
      "Research-adjacent loops with strongly practical coding — real problems in a real editor, systems questions about training and serving, and conversations about safety trade-offs.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding round in a real editor",
      "Onsite: systems design and domain rounds",
      "Values and mission conversation",
    ],
  },
  {
    slug: "optiver",
    name: "Optiver",
    blurb:
      "Market-making loops that start with timed mental-math and pattern tests before any code, then move into probability and technical rounds.",
    process: [
      "Recruiter screen",
      "Timed mental-math assessment",
      "Pattern-recognition and logic assessment",
      "Technical or probability interviews",
      "Onsite: trading games and final conversations",
    ],
  },
  {
    slug: "palantir",
    name: "Palantir",
    blurb:
      "Loops built around decomposing a vague, messy problem — expect an open-ended design conversation alongside practical coding.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Decomposition round on an open-ended problem",
      "Onsite: coding and design rounds",
      "Team-fit conversation",
    ],
  },
  {
    slug: "patreon",
    name: "Patreon",
    blurb:
      "Creator-platform loops with practical coding rounds and design questions about payouts, memberships, and creator tooling.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "point72",
    name: "Point72",
    blurb:
      "Investment-technology loops mixing algorithms and systems design with questions about data quality and research workflows.",
    process: [
      "Recruiter screen",
      "Online assessment",
      "Technical phone screen",
      "Onsite: algorithms and systems design rounds",
      "Final round with the investment or engineering team",
    ],
  },
  {
    slug: "pony-ai",
    name: "Pony.ai",
    blurb:
      "Self-driving loops with strong algorithm rounds, C++ depth, and domain questions tied to perception or planning.",
    process: [
      "Recruiter screen",
      "Online assessment: algorithms",
      "Technical phone screen",
      "Onsite: C++ and algorithm rounds",
      "Domain and hiring-manager round",
    ],
  },
  {
    slug: "pure-storage",
    name: "Pure Storage",
    blurb:
      "Storage-systems loops where C, memory, and performance questions matter, plus design rounds on durability and throughput.",
    process: [
      "Recruiter screen",
      "Technical phone screen: systems fundamentals",
      "Onsite: coding and data-structures rounds",
      "Storage architecture round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "qualcomm",
    name: "Qualcomm",
    blurb:
      "Embedded and systems loops — C, memory, and concurrency dominate, tuned to the silicon or platform team you are joining.",
    process: [
      "Recruiter screen",
      "Technical phone screen: C and systems fundamentals",
      "Onsite: coding, memory, and concurrency rounds",
      "Team-specific domain round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "qualtrics",
    name: "Qualtrics",
    blurb:
      "Experience-management loops with standard coding rounds, a design round on surveys and analytics, and a values interview.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral and culture round",
    ],
  },
  {
    slug: "reddit",
    name: "Reddit",
    blurb:
      "Loops grounded in the product: coding rounds, a design round on feeds and ranking, plus a values conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral round",
    ],
  },
  {
    slug: "remitly",
    name: "Remitly",
    blurb:
      "Remittance loops with practical coding rounds and design questions about payouts, compliance, and reliability.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "riot",
    name: "Riot",
    blurb:
      "Games loops with practical coding, gameplay or services design questions, and a culture round centered on players.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Gameplay or services design round",
      "Player-focus culture round",
    ],
  },
  {
    slug: "ripple",
    name: "Ripple",
    blurb:
      "Payments-infrastructure loops with coding rounds and design questions about cross-border settlement and distributed ledgers.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "rippling",
    name: "Rippling",
    blurb:
      "Fast, practical loops — a realistic coding exercise, a design round spanning HR, IT, and payroll systems, and a hiring-manager round.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "robinhood",
    name: "Robinhood",
    blurb:
      "Loops built around trading surfaces — coding rounds, a design round on order flow and real-time data, plus a behavioral round.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on real-time trading data",
      "Behavioral round",
    ],
  },
  {
    slug: "roblox",
    name: "Roblox",
    blurb:
      "Platform loops spanning engine, backend, and safety — coding rounds plus design questions about user-generated content at scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on platform and safety at scale",
      "Behavioral round",
    ],
  },
  {
    slug: "rokt",
    name: "Rokt",
    blurb:
      "Ecommerce-adtech loops pairing algorithms with design questions about real-time bidding and personalization.",
    process: [
      "Recruiter screen",
      "Online assessment: algorithms",
      "Technical phone screen",
      "Onsite: coding and real-time systems rounds",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "roku",
    name: "Roku",
    blurb:
      "Streaming-platform loops spanning device and cloud — coding rounds plus design questions about playback, ads, and constrained hardware.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on streaming and devices",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "rubrik",
    name: "Rubrik",
    blurb:
      "Data-management loops with distributed-systems depth — coding rounds, then design questions about backup, recovery, and consistency.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and distributed-systems rounds",
      "Architecture deep dive",
      "Behavioral round",
    ],
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    blurb:
      "Enterprise-scale loops — data structures, then multi-tenant design questions and a values round built around the company's Ohana framing.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Multi-tenant system design round",
      "Values and behavioral round",
    ],
  },
  {
    slug: "samsara",
    name: "Samsara",
    blurb:
      "IoT loops spanning embedded, cloud, and mobile — coding rounds plus design questions about fleets of devices all reporting at once.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on device fleets at scale",
      "Behavioral round",
    ],
  },
  {
    slug: "scale-ai",
    name: "Scale AI",
    blurb:
      "Data-infrastructure loops for machine learning: practical coding, pipeline design questions, and discussion of labeling quality at scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding round",
      "Design round on data pipelines",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "sentry",
    name: "Sentry",
    blurb:
      "Developer-tooling loops that favor real code over puzzles, with design questions about event ingestion and error grouping.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Practical coding round in a real codebase",
      "System design round",
      "Team and values conversation",
    ],
  },
  {
    slug: "sig",
    name: "SIG",
    blurb:
      "Loops built around decision-making under uncertainty — poker-style reasoning and probability alongside algorithms, with attention to how you handle incomplete information.",
    process: [
      "Recruiter screen",
      "Online assessment: math and logic",
      "Phone screen: probability and reasoning",
      "Onsite: coding, probability, and game-theory rounds",
      "Final round with the desk",
    ],
  },
  {
    slug: "smartnews",
    name: "SmartNews",
    blurb:
      "News-app loops with algorithm rounds and design questions about ranking, personalization, and mobile delivery.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral and culture round",
    ],
  },
  {
    slug: "snap",
    name: "Snap",
    blurb:
      "Fast-paced loops with camera and mobile-flavored design questions alongside standard coding rounds.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral round",
    ],
  },
  {
    slug: "sofi",
    name: "SoFi",
    blurb:
      "Consumer-finance loops with standard coding rounds and design questions about accounts, transfers, and compliance-aware systems.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "spotify",
    name: "Spotify",
    blurb:
      "Loops that pair practical coding with a design round on streaming and recommendations, and a strong culture component.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Take-home or practical coding round",
      "System design round",
      "Culture and collaboration round",
    ],
  },
  {
    slug: "squarepoint",
    name: "Squarepoint",
    blurb:
      "Data-driven quant loops: algorithms, statistics, and systems questions, tuned toward the research or engineering track you apply for.",
    process: [
      "Recruiter screen",
      "Online assessment",
      "Technical phone screen",
      "Onsite: algorithms, statistics, and systems rounds",
      "Final round with the team",
    ],
  },
  {
    slug: "tanium",
    name: "Tanium",
    blurb:
      "Endpoint-management loops with systems depth — coding rounds plus design questions about distributing work across very large fleets.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and distributed-systems rounds",
      "Architecture deep dive",
      "Behavioral round",
    ],
  },
  {
    slug: "tencent",
    name: "Tencent",
    blurb:
      "Algorithm-heavy loops with several technical rounds, a design discussion, and a final conversation with a senior manager.",
    process: [
      "Recruiter screen",
      "Online assessment",
      "Two technical rounds of algorithms",
      "System design round",
      "Senior-manager round",
    ],
  },
  {
    slug: "tiktok",
    name: "TikTok",
    blurb:
      "High-volume loops with several algorithm rounds, often back to back, then a design round and a hiring-manager conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Second technical phone screen",
      "Onsite: two to three algorithm rounds",
      "Hiring-manager and HR round",
    ],
  },
  {
    slug: "tinder",
    name: "Tinder",
    blurb:
      "Consumer-scale loops with coding rounds and design questions about matching, recommendations, and real-time messaging.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Product-minded design round",
      "Behavioral and culture round",
    ],
  },
  {
    slug: "tower-research",
    name: "Tower Research",
    blurb:
      "Latency-sensitive loops pairing strong algorithms with systems and networking questions, plus quantitative reasoning.",
    process: [
      "Recruiter screen",
      "Online assessment: timed coding",
      "Technical phone screen",
      "Onsite: algorithms, networking, and systems rounds",
      "Final round with the desk",
    ],
  },
  {
    slug: "trade-desk",
    name: "Trade Desk",
    blurb:
      "Programmatic-advertising loops where latency is the constraint — algorithms plus design questions about bidding at very high request rates.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two algorithm rounds",
      "Design round on low-latency bidding",
      "Behavioral round",
    ],
  },
  {
    slug: "twitch",
    name: "Twitch",
    blurb:
      "Live-video loops — coding rounds plus design questions about chat, streaming, and real-time scale.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "two-sigma",
    name: "Two Sigma",
    blurb:
      "Research-flavored loops: strong algorithms, statistics, and a systems round, with follow-ups that probe how you validate your own conclusions.",
    process: [
      "Recruiter screen",
      "Online assessment",
      "Technical phone screen: algorithms and statistics",
      "Onsite: coding, modeling, and systems rounds",
      "Final round with researchers and engineers",
    ],
  },
  {
    slug: "uber",
    name: "Uber",
    blurb:
      "Fast, practical loops — coding rounds under real time pressure, then a design round on marketplace and real-time systems.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "unity",
    name: "Unity",
    blurb:
      "Engine and tooling loops — C++ or C# depth, graphics and performance questions, plus design rounds tied to the editor or runtime.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and performance rounds",
      "Engine or tooling design round",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "upstart",
    name: "Upstart",
    blurb:
      "Lending and ML-flavored loops — coding rounds plus questions about models, features, and how automated decisions get audited.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Modeling and data design round",
      "Behavioral round",
    ],
  },
  {
    slug: "valve",
    name: "Valve",
    blurb:
      "Unstructured, conversation-driven loops — deep technical discussion and questions about what you would choose to work on with no one assigning it.",
    process: [
      "Recruiter screen",
      "Conversation with the group you would join",
      "Onsite: technical discussions across teams",
      "Portfolio or past-work deep dive",
      "Team decision",
    ],
  },
  {
    slug: "verkada",
    name: "Verkada",
    blurb:
      "Hardware-plus-cloud loops: practical coding, systems design for video at scale, and questions about managing devices in the field.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Design round on video and device management",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "vmware",
    name: "VMware",
    blurb:
      "Infrastructure loops where virtualization, operating systems, and concurrency questions sit alongside the usual algorithms.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: coding and operating-systems rounds",
      "Architecture deep dive",
      "Behavioral round",
    ],
  },
  {
    slug: "waymo",
    name: "Waymo",
    blurb:
      "Autonomy loops where algorithms meet robotics — coding rounds, a systems round, and domain questions tied to perception or planning.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Systems or domain round tied to your track",
      "Behavioral and collaboration round",
    ],
  },
  {
    slug: "wealthfront",
    name: "Wealthfront",
    blurb:
      "Automated-investing loops: clean coding rounds plus design questions about portfolios, tax logic, and getting the numbers exactly right.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on correctness-critical flows",
      "Hiring-manager conversation",
    ],
  },
  {
    slug: "whatnot",
    name: "Whatnot",
    blurb:
      "Live-commerce loops — practical coding plus design questions about live video, bidding, and payments under load.",
    process: [
      "Recruiter screen",
      "Hiring-manager conversation",
      "Practical coding round",
      "Onsite: system design round",
      "Product sense and values round",
    ],
  },
  {
    slug: "wise",
    name: "Wise",
    blurb:
      "Cross-border payments loops: practical coding, a design round on money movement and FX, plus a values conversation.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round on money movement",
      "Values and behavioral round",
    ],
  },
  {
    slug: "x",
    name: "X",
    blurb:
      "Lean, fast loops with a strong bias toward shipping — practical coding, systems questions, and direct conversations with the team you would join.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "System design round",
      "Team and hiring-manager conversation",
    ],
  },
  {
    slug: "zillow",
    name: "Zillow",
    blurb:
      "Consumer real-estate loops: coding rounds plus design questions about search, listings, and the data pipelines behind them.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two to three coding rounds",
      "System design round",
      "Behavioral round",
    ],
  },
  {
    slug: "zoox",
    name: "Zoox",
    blurb:
      "Robotics loops spanning perception, planning, and infrastructure — coding rounds plus domain-specific design questions.",
    process: [
      "Recruiter screen",
      "Technical phone screen",
      "Onsite: two coding rounds",
      "Domain round tied to your track",
      "Behavioral round",
    ],
  },
]);
