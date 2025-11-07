import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  InputAdornment,
  Stack,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Fade,
  IconButton,
} from "@mui/material";
import {
  Home,
  Print,
  Search,
  Link as LinkIcon,
  Check,
} from "@mui/icons-material";

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

// Minimalist, clean theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0066cc",
    },
    background: {
      default: "#ffffff",
      paper: "#fafafa",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: {
      fontSize: "2.5rem",
      fontWeight: 300,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
    },
    h5: {
      fontSize: "1.5rem",
      fontWeight: 400,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1.125rem",
      lineHeight: 1.8,
      color: "#333333",
    },
  },
  shape: {
    borderRadius: 0,
  },
});

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
      <Box
        component="mark"
        key={i}
        sx={{
          backgroundColor: "#ffeb3b",
          color: "#000",
          px: 0.5,
          fontWeight: 500,
        }}
      >
        {part}
      </Box>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export default function ProposalGuide({
  content,
  projectTitle,
}: {
  content: GuideContent;
  projectTitle: string;
}) {
  const [query, setQuery] = useState("");
  const hash = useHash();
  const all = useMemo(() => flatten(content.sections), [content]);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [hash]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return all
      .map((b) => ({
        id: b.id,
        title: b.title,
        snippet: (b.body || b.summary || "").slice(0, 120),
        score:
          (
            (b.title + " " + (b.body || "") + " " + (b.summary || ""))
              .toLowerCase()
              .match(new RegExp(q, "g")) || []
          ).length,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ id, title, snippet }) => ({ id, title, snippet }));
  }, [query, all]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "auto",
        }}
      >
        {/* Clean Header */}
        <Box
          sx={{
            bgcolor: "background.default",
            borderBottom: "1px solid #e0e0e0",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backdropFilter: "blur(10px)",
          }}
        >
          <Container maxWidth="md">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ py: 3 }}
            >
              <Link
                component={RouterLink}
                to="/"
                underline="none"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "text.secondary",
                  "&:hover": { color: "primary.main" },
                  transition: "color 0.2s",
                }}
              >
                <Home fontSize="small" />
                <Typography variant="body2" fontWeight={500}>
                  Home
                </Typography>
              </Link>
              <IconButton
                onClick={() => window.print()}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <Print fontSize="small" />
              </IconButton>
            </Stack>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Stack spacing={8}>
            {/* Hero Section */}
            <Box>
              <Typography
                variant="h3"
                gutterBottom
                sx={{ color: "text.primary", mb: 3 }}
              >
                {projectTitle}
              </Typography>
              {content.preface && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4, maxWidth: "800px" }}
                >
                  {content.preface}
                </Typography>
              )}

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: 600,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.paper",
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    },
                  },
                }}
              />

              {/* Search Results */}
              {query && results.length > 0 && (
                <Fade in>
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      {results.length} result{results.length !== 1 ? "s" : ""}
                    </Typography>
                    <Stack spacing={2}>
                      {results.map((r) => (
                        <Link
                          key={r.id}
                          href={`#${r.id}`}
                          underline="none"
                          sx={{
                            display: "block",
                            p: 2,
                            bgcolor: "background.paper",
                            "&:hover": { bgcolor: "#f5f5f5" },
                            transition: "background-color 0.2s",
                          }}
                        >
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            {highlight(r.title, query)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {highlight(r.snippet || "", query)}
                          </Typography>
                        </Link>
                      ))}
                    </Stack>
                  </Box>
                </Fade>
              )}
            </Box>

            <Divider />

            {/* Table of Contents */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Contents
              </Typography>
              <Stack spacing={1}>
                {content.sections.map((sec, idx) => (
                  <Link
                    key={sec.id}
                    href={`#${sec.id}`}
                    underline="none"
                    sx={{
                      display: "flex",
                      gap: 2,
                      py: 1,
                      color: "text.primary",
                      "&:hover": { color: "primary.main" },
                      transition: "color 0.2s",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ minWidth: 30 }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </Typography>
                    <Typography variant="body1">{sec.title}</Typography>
                  </Link>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 6 }} />

            {/* Sections */}
            {content.sections.map((sec) => (
              <Section key={sec.id} block={sec} query={query} />
            ))}
          </Stack>
        </Container>

        {/* Footer spacing */}
        <Box sx={{ height: 100 }} />
      </Box>
    </ThemeProvider>
  );
}

function Section({ block, query }: { block: GuideBlock; query: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(
      block.id
    )}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box id={block.id} component="section" sx={{ scrollMarginTop: 100 }}>
      <Stack spacing={4}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              {highlight(block.title, query)}
            </Typography>
            <IconButton
              size="small"
              onClick={copy}
              sx={{
                color: copied ? "success.main" : "text.disabled",
                "&:hover": { color: "primary.main" },
              }}
            >
              {copied ? <Check fontSize="small" /> : <LinkIcon fontSize="small" />}
            </IconButton>
          </Stack>

          {block.summary && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3,
                pl: 3,
                borderLeft: "3px solid",
                borderColor: "primary.main",
                fontStyle: "italic",
              }}
            >
              {highlight(block.summary, query)}
            </Typography>
          )}

          {block.body && (
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {highlight(block.body, query)}
            </Typography>
          )}
        </Box>

        {/* Subsections */}
        {(block.children ?? []).map((sub) => (
          <SubSection key={sub.id} block={sub} query={query} />
        ))}
      </Stack>
    </Box>
  );
}

function SubSection({ block, query }: { block: GuideBlock; query: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(
      block.id
    )}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box
      id={block.id}
      sx={{
        pl: 4,
        py: 3,
        bgcolor: "background.paper",
        scrollMarginTop: 100,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {highlight(block.title, query)}
          </Typography>
          <IconButton
            size="small"
            onClick={copy}
            sx={{
              color: copied ? "success.main" : "text.disabled",
              "&:hover": { color: "primary.main" },
            }}
          >
            {copied ? <Check fontSize="small" /> : <LinkIcon fontSize="small" />}
          </IconButton>
        </Stack>

        {block.summary && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            {highlight(block.summary, query)}
          </Typography>
        )}

        {block.body && (
          <Typography variant="body1">{highlight(block.body, query)}</Typography>
        )}
      </Stack>
    </Box>
  );
}

export const CONTENT = {
  preface:
    "An interactive walkthrough of the proposal: scope, methods, timeline, ethics, risks, and deliverables.",
  sections: [
    {
      id: "executive-summary",
      title: "Executive Summary",
      summary:
        "Clear statement of the project, who it serves, and what success looks like.",
      body: "This project develops an accessible, gesture-controlled music tool co-designed with disabled musicians, producing both a deployable instrument and a research framework for inclusive AI design.",
    },
    {
      id: "background-context",
      title: "Background & Context",
      summary:
        "Why accessibility in AI music tools needs an embodied, disability-led approach.",
      children: [
        {
          id: "problem-space",
          title: "Problem Space",
          body: "Existing ADMIs often assume normative bodies and stable motion capture. Disabled musicians face barriers in mapping movement to sound in flexible, expressive ways.",
        },
        {
          id: "contribution",
          title: "Your Contribution",
          body: "We propose an MVP → ML-enhanced pathway with co-design workshops (Drake Music NI), articulating an Embodied AI Design Principles set and a deployable browser-based tool.",
        },
      ],
    },
    {
      id: "research-questions",
      title: "Research Questions",
      body: "RQ1: How can gesture-to-sound mappings be adapted to diverse bodies in real time? RQ2: What evaluation markers meaningfully capture embodied engagement? RQ3: Which AI filtering strategies reduce false negatives/positives without narrowing expression?",
    },
    {
      id: "methodology",
      title: "Methodology",
      summary:
        "Participatory design, iterative MVP cycles, and targeted ML filtering.",
      children: [
        {
          id: "frameworks",
          title: "Theoretical & Ethical Frameworks",
          body: "Embodied music cognition, social model of disability, inclusive design; ethics focused on consent, welfare, and data minimisation.",
        },
        {
          id: "mvp-phase",
          title: "MVP Phase (Step-by-Step)",
          body: "(1) Map minimal gestures to sound. (2) Run Workshop 1 for feedback. (3) Iterate mappings and UI. (4) Accessibility testing. (5) Lock MVP for longitudinal evaluation.",
        },
        {
          id: "ml-phase",
          title: "ML Phase",
          body: "Introduce filtering/classification for stability and noise reduction. Emphasise transparency and user control over thresholds and active body parts.",
        },
        {
          id: "evaluation",
          title: "Evaluation",
          body: "Mixed-methods: interviews, observation notes, UX scales, and gesture event analytics to triangulate musical agency and engagement.",
        },
      ],
    },
    {
      id: "timeline",
      title: "Timeline",
      body: "Quarter-by-quarter plan with dependencies (workshops, ethics approvals, development sprints, conference submissions, and thesis chapters).",
    },
    {
      id: "risks-mitigations",
      title: "Risks & Mitigations",
      body: "Scheduling risks, fatigue considerations, sensor/pose instability; mitigations include flexible session planning, adaptive thresholds, and offline fallbacks.",
    },
    {
      id: "deliverables",
      title: "Deliverables",
      body: "Accessible tool (web), documentation site, papers, datasets or configuration presets, workshop pack, design principles, and thesis chapters.",
    },
    {
      id: "appendices",
      title: "Appendices",
      summary: "Workshop plans, interview guides, system diagrams, references.",
      children: [
        {
          id: "workshop-plan",
          title: "Workshop Plan (Example)",
          body: "Agenda, roles, accessibility provisions, consent flow, feedback prompts, and debrief notes template.",
        },
        {
          id: "system-diagram",
          title: "System Diagram",
          body: "High-level architecture of webcam → pose → mapping → sound engine, with adjustable filters and user profiles.",
        },
      ],
    },
  ],
};
