import { EbookItem } from '../types';

export const DEFAULT_EBOOKS: EbookItem[] = [
  {
    id: "michigan-smb-automation-blueprint",
    sku: "JNJ-BK-001",
    title: "Michigan SMB Automation Blueprint",
    subtitle: "A Business Technology Playbook for Pragmatic Operations",
    author: "JNJ Innovations Advisory Practice",
    price: 39,
    originalPrice: 59,
    isOnSale: true,
    category: "Automation",
    inventoryCount: 45,
    isUnlimited: false,
    status: "active",
    format: ["PDF (Print Quality)", "ePub (Universal Reader)", "Excel ROI Model"],
    pages: 184,
    publishedYear: "2026",
    edition: "First Executive Edition",
    badgeText: "Bestseller",
    description: "Battle-tested workflows, calculation spreadsheets, and implementation roadmaps for Michigan business owners.",
    longDescription: "Designed specifically for Midwestern manufacturing, logistics, and professional service operators.",
    tableOfContents: [
      { chapter: "01", title: "Diagnostic Assessment: Process Waste Audit", pages: "1-28" },
      { chapter: "02", title: "Low-Code vs Custom Automation Matrix", pages: "29-74" },
      { chapter: "03", title: "Vendor Integration & Legacy ERP Bridges", pages: "75-120" },
      { chapter: "04", title: "Financial Return Modeling & Verification", pages: "121-184" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 1: The Operator Dilemma",
        pageNumber: 12,
        text: "The most expensive automation is the one built on broken manual processes. Before writing a line of code or subscribing to integration SaaS, map every handoff."
      }
    ],
    includedAssets: [
      "Excel Automation ROI Calculator (.xlsx)",
      "Vendor Evaluation Matrix (.pdf)",
      "Standard Operating Procedure Template (.docx)"
    ],
    coverDesign: {
      theme: "navy",
      bgColor: "#0A1628",
      accentColor: "#38bdf8",
      textColor: "#ffffff",
      pattern: "blueprint-grid",
      showCoverImage: true
    },
    rating: 4.9,
    reviewCount: 38,
    salesCount: 142
  },
  {
    id: "modern-cloud-architecture-playbook",
    sku: "JNJ-BK-002",
    title: "Modern Cloud Architecture & Migration Playbook",
    subtitle: "Cost-Optimized Hybrid Infrastructure for Mid-Market Enterprises",
    author: "JNJ Innovations Systems Architecture Group",
    price: 49,
    originalPrice: 69,
    isOnSale: false,
    category: "Cloud & Infrastructure",
    inventoryCount: 9999,
    isUnlimited: true,
    status: "active",
    format: ["PDF (Vector)", "ePub", "Terraform Snippet Library"],
    pages: 236,
    publishedYear: "2026",
    edition: "Cloud Architecture Series",
    badgeText: "Enterprise Choice",
    description: "Step-by-step guidance on zero-downtime database and workload migrations with cost containment safeguards.",
    longDescription: "Avoid runaway cloud bills and multi-year migration stalls with our battle-proven 5-phase migration playbook.",
    tableOfContents: [
      { chapter: "01", title: "Pre-Migration Infrastructure Audit", pages: "1-42" },
      { chapter: "02", title: "Multi-Cloud vs Single-Provider Realities", pages: "43-98" },
      { chapter: "03", title: "Database Cutover and Data Consistency", pages: "99-164" },
      { chapter: "04", title: "FinOps: Continuous Cost Guardrails", pages: "165-236" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 3: Zero-Loss Database Cutovers",
        pageNumber: 104,
        text: "Always maintain dual-write replication for at least 72 hours before severing the legacy database connections."
      }
    ],
    includedAssets: [
      "Terraform VPC Baseline Blueprint (.tf)",
      "Monthly Cloud Budgeting Sheet (.xlsx)"
    ],
    coverDesign: {
      theme: "charcoal",
      bgColor: "#18181b",
      accentColor: "#fbbf24",
      textColor: "#f4f4f5",
      pattern: "geometric-cubes",
      showCoverImage: true
    },
    rating: 4.8,
    reviewCount: 29,
    salesCount: 88
  },
  {
    id: "cybersecurity-defense-field-manual",
    sku: "JNJ-BK-003",
    title: "Cybersecurity Defense & Incident Response Field Manual",
    subtitle: "Ransomware Prevention, Compliance, and Business Continuity",
    author: "JNJ Innovations Cyber Advisory",
    price: 45,
    originalPrice: 55,
    isOnSale: false,
    category: "Cybersecurity",
    inventoryCount: 18,
    isUnlimited: false,
    status: "low_stock",
    format: ["PDF", "ePub", "Incident Response Checklists"],
    pages: 198,
    publishedYear: "2026",
    edition: "Security Series v3",
    badgeText: "Critical Guide",
    description: "Practical security playbooks for organizations without eight-figure cybersecurity budgets.",
    longDescription: "Concrete strategies covering identity governance, credential hardening, endpoint detection, and response simulation.",
    tableOfContents: [
      { chapter: "01", title: "Threat Surface Minimization", pages: "1-36" },
      { chapter: "02", title: "Zero Trust Identity Architecture", pages: "37-88" },
      { chapter: "03", title: "Incident Response Playbook", pages: "89-148" },
      { chapter: "04", title: "Post-Incident Recovery & Forensics", pages: "149-198" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 1: The Perimeter is Dead",
        pageNumber: 18,
        text: "Assume compromise. Verify every identity, validate device compliance, and enforce micro-segmentation."
      }
    ],
    includedAssets: [
      "1-Hour Incident Response Checklist (.pdf)",
      "Vendor Security Due Diligence Audit (.docx)"
    ],
    coverDesign: {
      theme: "crimson",
      bgColor: "#4c0519",
      accentColor: "#f43f5e",
      textColor: "#fff1f2",
      pattern: "shield",
      showCoverImage: true
    },
    rating: 5.0,
    reviewCount: 42,
    salesCount: 110
  },
  {
    id: "pragmatic-ai-workflow-optimization",
    sku: "JNJ-BK-004",
    title: "Pragmatic AI & Workflow Optimization",
    subtitle: "Integrating Language Models and Automation into Operations",
    author: "JNJ Innovations AI Research",
    price: 49,
    originalPrice: 79,
    isOnSale: true,
    category: "AI & Analytics",
    inventoryCount: 9999,
    isUnlimited: true,
    status: "active",
    format: ["PDF", "ePub", "Prompt System Libraries"],
    pages: 210,
    publishedYear: "2026",
    edition: "2026 Release",
    badgeText: "Trending",
    description: "Real-world operational AI applications that eliminate repetitive paperwork and enhance team throughput.",
    longDescription: "Moving past hype: clear architectural guidelines for privacy-compliant AI adoption in regulated industries.",
    tableOfContents: [
      { chapter: "01", title: "Evaluating Practical AI Opportunities", pages: "1-40" },
      { chapter: "02", title: "Data Privacy & Governance Boundaries", pages: "41-90" },
      { chapter: "03", title: "Structured Extraction & Workflow Bots", pages: "91-155" },
      { chapter: "04", title: "Human-in-the-Loop Quality Assurance", pages: "156-210" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 2: Privacy First",
        pageNumber: 48,
        text: "Never send proprietary customer data to public model endpoints without client-side anonymization."
      }
    ],
    includedAssets: [
      "Production System Prompts (.txt)",
      "API Cost Forecasting Sheet (.xlsx)"
    ],
    coverDesign: {
      theme: "amethyst",
      bgColor: "#3b0764",
      accentColor: "#c084fc",
      textColor: "#faf5ff",
      pattern: "neural-network",
      showCoverImage: true
    },
    rating: 4.9,
    reviewCount: 51,
    salesCount: 165
  },
  {
    id: "executive-digital-transformation-roadmap",
    sku: "JNJ-BK-005",
    title: "Executive Digital Transformation Roadmap",
    subtitle: "A C-Suite Field Guide to Software Investments & Cultural Change",
    author: "JNJ Innovations Strategy Partners",
    price: 59,
    originalPrice: 79,
    isOnSale: false,
    category: "Leadership & Operations",
    inventoryCount: 30,
    isUnlimited: false,
    status: "active",
    format: ["PDF", "Executive Slide Deck Template"],
    pages: 168,
    publishedYear: "2026",
    edition: "Executive Briefing",
    badgeText: "Boardroom Favorite",
    description: "Frameworks for budgeting, executing, and measuring tech initiatives without consultants on retainers.",
    longDescription: "Bridge the communication gap between business vision and engineering execution.",
    tableOfContents: [
      { chapter: "01", title: "Aligning Tech Initiatives with EBITDA", pages: "1-38" },
      { chapter: "02", title: "Overcoming Staff Resistance", pages: "39-82" },
      { chapter: "03", title: "Vendor Contract Negotiation Playbook", pages: "83-125" },
      { chapter: "04", title: "Measuring Real Velocity", pages: "126-168" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 1: The Real Cost of Stagnation",
        pageNumber: 22,
        text: "Technology debt accrues interest exponentially. Tackle high-friction bottlenecks before scaling headcount."
      }
    ],
    includedAssets: [
      "Board Presentation Deck Template (.pptx)",
      "Digital Maturity Scorecard (.xlsx)"
    ],
    coverDesign: {
      theme: "emerald",
      bgColor: "#064e3b",
      accentColor: "#34d399",
      textColor: "#ecfdf5",
      pattern: "minimalist-rule",
      showCoverImage: true
    },
    rating: 4.9,
    reviewCount: 19,
    salesCount: 64
  },
  {
    id: "industrial-iot-edge-computing",
    sku: "JNJ-BK-006",
    title: "Industrial IoT & Edge Computing Playbook",
    subtitle: "Connecting Shop Floors, Sensors, and Real-Time Telemetry",
    author: "JNJ Innovations Advanced Manufacturing",
    price: 49,
    originalPrice: 65,
    isOnSale: false,
    category: "Automation",
    inventoryCount: 12,
    isUnlimited: false,
    status: "low_stock",
    format: ["PDF", "ePub", "Modbus & MQTT Reference"],
    pages: 220,
    publishedYear: "2026",
    edition: "Industrial Series",
    badgeText: "Specialized",
    description: "Practical sensor connectivity, predictive maintenance, and local compute on factory floors.",
    longDescription: "A pragmatic guide to extracting machine telemetry from legacy PLC systems without stopping the line.",
    tableOfContents: [
      { chapter: "01", title: "Legacy PLC & Sensor Interfacing", pages: "1-45" },
      { chapter: "02", title: "Edge Compute Gateways & MQTT", pages: "46-105" },
      { chapter: "03", title: "Predictive Anomaly Detection", pages: "106-168" },
      { chapter: "04", title: "Secure Local-to-Cloud Pipes", pages: "169-220" }
    ],
    sampleContent: [
      {
        chapterTitle: "Chapter 2: Robust Shop Floor Gateways",
        pageNumber: 52,
        text: "Shop floors suffer power blips and electrical noise. Always decouple sensor I/O with optoisolators."
      }
    ],
    includedAssets: [
      "MQTT Sensor Gateway Config (.yaml)",
      "Predictive Maintenance Threshold Guide (.pdf)"
    ],
    coverDesign: {
      theme: "steel",
      bgColor: "#1e293b",
      accentColor: "#94a3b8",
      textColor: "#f8fafc",
      pattern: "circuit-matrix",
      showCoverImage: true
    },
    rating: 4.7,
    reviewCount: 14,
    salesCount: 41
  }
];
