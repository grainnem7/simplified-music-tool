import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, FileText, Home, Link as LinkIcon, Printer, Search } from "lucide-react";
import "./ProposalGuide.css";

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
      <mark key={i}>{part}</mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

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

  function onPrint() {
    window.print();
  }

  return (
    <div className="proposal-guide">
      <a href="#main" className="skip-link">Skip to content</a>

      <header>
        <div className="header-content">
          <div className="breadcrumb">
            <Home size={16} aria-hidden />
            <RouterLink to="/">Home</RouterLink>
            <span aria-hidden>›</span>
            <span>Proposal</span>
          </div>
          <div className="header-actions">
            <button onClick={onPrint} className="btn-print">
              <Printer size={16} /> Print / Export
            </button>
          </div>
        </div>
      </header>

      <div className="main-grid">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">{projectTitle}</h1>
            {content.preface && <p className="sidebar-preface">{content.preface}</p>}
          </div>

          <div className="search-box">
            <label htmlFor="guide-search" className="skip-link">Search</label>
            <div className="search-wrapper">
              <Search size={16} />
              <input
                id="guide-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the guide..."
                className="search-input"
              />
            </div>
            {query && (
              <div className="search-results">
                <div className="search-results-title">Matches</div>
                <ul className="search-results-list">
                  {results.map((r) => (
                    <li key={r.id} className="search-result-item">
                      <a href={`#${r.id}`} className="search-result-link">
                        <div className="search-result-title">{highlight(r.title, query)}</div>
                        <div className="search-result-snippet">{highlight(r.snippet || "", query)}</div>
                      </a>
                    </li>
                  ))}
                  {results.length === 0 && <div className="search-no-results">No matches.</div>}
                </ul>
              </div>
            )}
          </div>

          <nav aria-label="Table of contents" className="toc-nav">
            <ul className="toc-list">
              {content.sections.map((sec) => (
                <li key={sec.id} className="toc-section">
                  <button
                    className="toc-section-btn"
                    onClick={() => toggle(sec.id)}
                    aria-expanded={!!expanded[sec.id]}
                    aria-controls={`toc-${sec.id}`}
                  >
                    {expanded[sec.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="toc-section-title">{sec.title}</span>
                  </button>
                  <div id={`toc-${sec.id}`} style={{ display: expanded[sec.id] ? 'block' : 'none' }}>
                    <ul className="toc-subsections">
                      <li className="toc-subsection-item">
                        <a href={`#${sec.id}`} className="toc-subsection-link">
                          <FileText size={16} /> Overview
                        </a>
                      </li>
                      {(sec.children ?? []).map((sub) => (
                        <li key={sub.id} className="toc-subsection-item">
                          <a href={`#${sub.id}`} className="toc-subsection-link">
                            <ChevronRight size={16} /> {sub.title}
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

        <main id="main" className="main-content">
          {content.sections.map((sec) => (
            <Section key={sec.id} block={sec} query={query} />
          ))}
        </main>
      </div>
    </div>
  );
}

function Section({ block, query }: { block: GuideBlock; query: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(block.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <section id={block.id} className="section">
      <header className="section-header">
        <h2 className="section-title">{highlight(block.title, query)}</h2>
        <button onClick={copy} className="btn-copy no-print">
          <LinkIcon size={16} /> {copied ? "Copied" : "Copy link"}
        </button>
      </header>

      {block.summary && <p className="section-summary">{highlight(block.summary, query)}</p>}

      {block.body && (
        <div className="section-body">
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
    <div id={block.id} className="subsection">
      <button
        className="subsection-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="subsection-title">{highlight(block.title, query)}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="subsection-content">
          {block.summary && <p className="subsection-summary">{highlight(block.summary, query)}</p>}

          {block.body && (
            <div className="subsection-body">
              <p>{highlight(block.body, query)}</p>
            </div>
          )}

          <div className="subsection-actions">
            <button onClick={copy} className="btn-copy">
              <LinkIcon size={16} /> {copied ? "Copied" : "Copy link"}
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
