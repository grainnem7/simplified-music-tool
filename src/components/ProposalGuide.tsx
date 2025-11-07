import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, FileText, Home, Link as LinkIcon, Printer, Search, Upload } from "lucide-react";

/**
 * ProposalGuide.tsx
 * ---------------------------------------------------------------------------
 * A drop-in, ultra-clear, interactive documentation UI for your project proposal.
 *
 * Goals
 * - Clickable sections with deep links (hash routing)
 * - Search across titles & content
 * - Sticky sidebar TOC with progress highlighting
 * - Print / Export (browser print to PDF)
 * - Zero external UI deps beyond Tailwind + lucide-react
 * - Strictly no rounded corners to match your preference
 * - Accessible (ARIA roles, keyboard nav, skip links)
 *
 * Usage
 * 1) Drop this file into your React app (e.g., src/components/ProposalGuide.tsx)
 * 2) Ensure Tailwind is set up. Add `scroll-smooth` on <html> for smooth jumps.
 * 3) Render <ProposalGuide content={CONTENT} projectTitle="Amplifying Accessibility in Artificial Music Systems" />
 * 4) Optionally mount at /proposal using your Router.
 *
 * Integration (example)
 *   <Route path="/proposal" element={<ProposalGuide content={CONTENT} projectTitle="Amplifying Accessibility in Artificial Music Systems" />} />
 *
 * The CONTENT constant at the bottom shows the schema.
 */

// ----------------------------- Types ------------------------------
export type GuideBlock = {
  id: string;
  title: string;
  kind?: "section" | "subsection" | "appendix";
  summary?: string;
  body?: string;
  children?: GuideBlock[];
};

export type GuideContent = {
  preface?: string;
  sections: GuideBlock[];
};

// -------------------------- Utilities ----------------------------
function flatten(blocks: GuideBlock[]): GuideBlock[] {
  const out: GuideBlock[] = [];
  const visit = (b: GuideBlock) => {
    out.push(b);
    (b.children ?? []).forEach(visit);
  };
  blocks.forEach(visit);
  return out;
}

function useHash(): string {
  const { hash } = useLocation();
  return decodeURIComponent(hash.replace(/^#/, ""));
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-yellow-300 text-black px-0.5">{part}</mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

// ---------------------------- UI ---------------------------------
export default function ProposalGuide({ content, projectTitle }: { content: GuideContent; projectTitle: string }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const hash = useHash();
  const all = useMemo(() => flatten(content.sections), [content]);

  useEffect(() => {
    if (!hash) return;
    const parents = new Set<string>();
    function findParents(blocks: GuideBlock[], trail: string[] = []) {
      for (const b of blocks) {
        if (b.id === hash) {
          trail.forEach((t) => parents.add(t));
          return true;
        }
        if (b.children && findParents(b.children, [...trail, b.id])) return true;
      }
      return false;
    }
    findParents(content.sections);
    if (parents.size) {
      setExpanded((e) => ({ ...e, ...Array.from(parents).reduce((acc, k) => ({ ...acc, [k]: true }), {}) }));
    }
  }, [hash, content.sections]);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return all
      .map((b) => ({
        id: b.id,
        title: b.title,
        snippet: (b.body || b.summary || "").slice(0, 200),
        score: ((b.title + " " + (b.body || "") + " " + (b.summary || "")).toLowerCase().match(new RegExp(q, "g")) || []).length,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ id, title, snippet }) => ({ id, title, snippet }));
  }, [query, all]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
  }

  function onPrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-black text-white px-3 py-2">Skip to content</a>

      <header className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Home className="h-4 w-4" aria-hidden />
            <RouterLink to="/" className="hover:underline">Home</RouterLink>
            <span aria-hidden>›</span>
            <span>Proposal</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onPrint} className="flex items-center gap-2 border border-neutral-800 px-3 py-1 uppercase tracking-wide text-xs hover:bg-neutral-900 hover:text-white">
              <Printer className="h-4 w-4" /> Print / Export
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid grid-cols-12">
        <aside className="col-span-12 md:col-span-3 lg:col-span-3 border-r border-neutral-300 bg-white sticky top-0 h-[calc(100vh-1px)] overflow-auto">
          <div className="p-4 border-b border-neutral-300">
            <h1 className="text-xl font-semibold leading-tight">{projectTitle}</h1>
            {content.preface && <p className="mt-2 text-sm text-neutral-700">{content.preface}</p>}
          </div>

          <div className="p-4 border-b border-neutral-300">
            <label htmlFor="guide-search" className="sr-only">Search</label>
            <div className="flex items-center border border-neutral-800">
              <Search className="h-4 w-4 ml-2" />
              <input
                id="guide-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the guide..."
                className="w-full px-2 py-2 outline-none"
              />
            </div>
            {query && (
              <div className="mt-3 border-t border-neutral-200 pt-3">
                <div className="text-xs uppercase text-neutral-600 mb-2">Matches</div>
                <ul className="space-y-2">
                  {results.map((r) => (
                    <li key={r.id}>
                      <a href={`#${r.id}`} className="block hover:underline">
                        <div className="text-sm font-medium">{highlight(r.title, query)}</div>
                        <div className="text-xs text-neutral-600">{highlight(r.snippet || "", query)}</div>
                      </a>
                    </li>
                  ))}
                  {results.length === 0 && <div className="text-xs text-neutral-600">No matches.</div>}
                </ul>
              </div>
            )}
          </div>

          <nav aria-label="Table of contents" className="p-2">
            <ul>
              {content.sections.map((sec) => (
                <li key={sec.id} className="border-b border-neutral-200">
                  <button
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-50"
                    onClick={() => toggle(sec.id)}
                    aria-expanded={!!expanded[sec.id]}
                    aria-controls={`toc-${sec.id}`}
                  >
                    {expanded[sec.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{sec.title}</span>
                  </button>
                  <div id={`toc-${sec.id}`} className={expanded[sec.id] ? "block" : "hidden"}>
                    <ul>
                      <li className="px-6 py-2 text-sm">
                        <a href={`#${sec.id}`} className="hover:underline inline-flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Overview
                        </a>
                      </li>
                      {(sec.children ?? []).map((sub) => (
                        <li key={sub.id} className="px-6 py-2 text-sm">
                          <a href={`#${sub.id}`} className="hover:underline inline-flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" /> {sub.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main id="main" className="col-span-12 md:col-span-9 lg:col-span-9 p-6">
          {content.sections.map((sec) => (
            <Section key={sec.id} block={sec} query={query} />
          ))}
        </main>
      </div>
    </div>
  );
}

function Section({ block, query }: { block: GuideBlock; query: string }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(block.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <section id={block.id} ref={ref} className="mb-10">
      <header className="flex items-baseline justify-between border-b border-neutral-300 pb-2">
        <h2 className="text-2xl font-semibold tracking-tight">{highlight(block.title, query)}</h2>
        <button
          onClick={copy}
          className="no-print inline-flex items-center gap-2 border border-neutral-800 px-2 py-1 text-xs uppercase hover:bg-neutral-900 hover:text-white"
        >
          <LinkIcon className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
        </button>
      </header>

      {block.summary && <p className="mt-3 text-neutral-700">{highlight(block.summary, query)}</p>}

      {block.body && (
        <div className="prose prose-neutral max-w-none mt-4">
          <p>{highlight(block.body, query)}</p>
        </div>
      )}

      {(block.children ?? []).map((sub) => (
        <SubSection key={sub.id} block={sub} query={query} />
      ))}
    </section>
  );
}

function SubSection({ block, query }: { block: GuideBlock; query: string }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(block.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div id={block.id} className="mt-6 border border-neutral-300">
      <button
        className="w-full flex items-center justify-between px-4 py-2 text-left bg-neutral-50 hover:bg-neutral-100"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium">{highlight(block.title, query)}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {open && (
        <div className="p-4 bg-white">
          {block.summary && <p className="text-neutral-700 mb-2">{highlight(block.summary, query)}</p>}

          {block.body && (
            <div className="prose prose-neutral max-w-none">
              <p>{highlight(block.body, query)}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 border border-neutral-800 px-2 py-1 text-xs uppercase hover:bg-neutral-900 hover:text-white"
            >
              <LinkIcon className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const CONTENT = {
  preface:
    "An interactive, thorough walkthrough of the proposal: scope, methods, timeline, ethics, risks, and deliverables. Click any section for details or share deep links with the committee.",
  sections: [
    {
      id: "executive-summary",
      title: "Executive Summary",
      summary: "Clear statement of the project, who it serves, and what success looks like.",
      body:
        "This project develops an accessible, gesture-controlled music tool co-designed with disabled musicians, producing both a deployable instrument and a research framework for inclusive AI design.",
    },
    {
      id: "background-context",
      title: "Background & Context",
      summary: "Why accessibility in AI music tools needs an embodied, disability-led approach.",
      children: [
        {
          id: "problem-space",
          title: "Problem Space",
          body:
            "Existing ADMIs often assume normative bodies and stable motion capture. Disabled musicians face barriers in mapping movement to sound in flexible, expressive ways.",
        },
        {
          id: "contribution",
          title: "Your Contribution",
          body:
            "We propose an MVP → ML-enhanced pathway with co-design workshops (Drake Music NI), articulating an Embodied AI Design Principles set and a deployable browser-based tool.",
        },
      ],
    },
    {
      id: "research-questions",
      title: "Research Questions",
      body:
        "RQ1: How can gesture-to-sound mappings be adapted to diverse bodies in real time? RQ2: What evaluation markers meaningfully capture embodied engagement? RQ3: Which AI filtering strategies reduce false negatives/positives without narrowing expression?",
    },
    {
      id: "methodology",
      title: "Methodology",
      summary: "Participatory design, iterative MVP cycles, and targeted ML filtering.",
      children: [
        {
          id: "frameworks",
          title: "Theoretical & Ethical Frameworks",
          body:
            "Embodied music cognition, social model of disability, inclusive design; ethics focused on consent, welfare, and data minimisation.",
        },
        {
          id: "mvp-phase",
          title: "MVP Phase (Step-by-Step)",
          body:
            "(1) Map minimal gestures to sound. (2) Run Workshop 1 for feedback. (3) Iterate mappings and UI. (4) Accessibility testing. (5) Lock MVP for longitudinal evaluation.",
        },
        {
          id: "ml-phase",
          title: "ML Phase",
          body:
            "Introduce filtering/classification for stability and noise reduction. Emphasise transparency and user control over thresholds and active body parts.",
        },
        {
          id: "evaluation",
          title: "Evaluation",
          body:
            "Mixed-methods: interviews, observation notes, UX scales, and gesture event analytics to triangulate musical agency and engagement.",
        },
      ],
    },
    {
      id: "timeline",
      title: "Timeline",
      body:
        "Quarter-by-quarter plan with dependencies (workshops, ethics approvals, development sprints, conference submissions, and thesis chapters).",
    },
    {
      id: "risks-mitigations",
      title: "Risks & Mitigations",
      body:
        "Scheduling risks, fatigue considerations, sensor/pose instability; mitigations include flexible session planning, adaptive thresholds, and offline fallbacks.",
    },
    {
      id: "deliverables",
      title: "Deliverables",
      body:
        "Accessible tool (web), documentation site, papers, datasets or configuration presets, workshop pack, design principles, and thesis chapters.",
    },
    {
      id: "appendices",
      title: "Appendices",
      summary: "Workshop plans, interview guides, system diagrams, references.",
      children: [
        {
          id: "workshop-plan",
          title: "Workshop Plan (Example)",
          body:
            "Agenda, roles, accessibility provisions, consent flow, feedback prompts, and debrief notes template.",
        },
        {
          id: "system-diagram",
          title: "System Diagram",
          body:
            "High-level architecture of webcam → pose → mapping → sound engine, with adjustable filters and user profiles.",
        },
      ],
    },
  ],
};
