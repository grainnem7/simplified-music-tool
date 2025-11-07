import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CssBaseline,
  ThemeProvider,
  createTheme,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import {
  Home,
  Print,
  Search,
  KeyboardArrowRight,
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

// Clean, accessible theme with better contrast
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#f5f5f5",
    },
    background: {
      default: "#ffffff",
      paper: "#fafafa",
    },
    text: {
      primary: "#212121",
      secondary: "#616161",
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h2: {
      fontSize: "2.25rem",
      fontWeight: 700,
      marginBottom: "1.5rem",
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      marginBottom: "1rem",
      letterSpacing: "-0.01em",
    },
    h4: {
      fontSize: "1.125rem",
      fontWeight: 600,
      marginBottom: "0.75rem",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.8,
      color: "#424242",
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
      .filter((b) =>
        (b.title + " " + (b.body || "") + " " + (b.summary || ""))
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
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
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: 2.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Button
                component={RouterLink}
                to="/"
                startIcon={<Home />}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Back to Home
              </Button>
              <IconButton
                onClick={() => window.print()}
                sx={{
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
                aria-label="Print documentation"
              >
                <Print />
              </IconButton>
            </Stack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ maxWidth: 900, mx: "auto", px: 3, py: 5 }}>
          {/* Title & Search */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: "text.primary",
                mb: 2,
              }}
            >
              {projectTitle}
            </Typography>
            {content.preface && (
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  fontSize: "1.125rem",
                  color: "text.secondary",
                  maxWidth: "800px",
                }}
              >
                {content.preface}
              </Typography>
            )}

            <TextField
              fullWidth
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 600,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "white",
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />

            {/* Search Results */}
            {query && results.length > 0 && (
              <Card sx={{ mt: 2, maxWidth: 600 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Found {results.length} result{results.length !== 1 ? "s" : ""}
                  </Typography>
                  <Stack spacing={1}>
                    {results.map((r) => (
                      <Button
                        key={r.id}
                        href={`#${r.id}`}
                        fullWidth
                        sx={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          textTransform: "none",
                        }}
                      >
                        {r.title}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Table of Contents */}
          <Card
            sx={{
              mb: 5,
              bgcolor: "background.paper",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  color: "text.primary",
                  mb: 3,
                }}
              >
                Contents
              </Typography>
              <Stack spacing={1.5}>
                {content.sections.map((sec, idx) => (
                  <Button
                    key={sec.id}
                    href={`#${sec.id}`}
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={
                      <Box
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          mr: 1,
                        }}
                      >
                        {idx + 1}
                      </Box>
                    }
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      fontSize: "1rem",
                      py: 2,
                      px: 2,
                      textAlign: "left",
                      fontWeight: 500,
                      borderColor: "divider",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "rgba(25, 118, 210, 0.04)",
                      },
                    }}
                  >
                    {sec.title}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Sections */}
          <Stack spacing={5}>
            {content.sections.map((sec, idx) => (
              <Card
                key={sec.id}
                id={sec.id}
                sx={{
                  bgcolor: "white",
                  scrollMarginTop: 80,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        minWidth: 56,
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        color: "text.primary",
                        pt: 0.5,
                      }}
                    >
                      {sec.title}
                    </Typography>
                  </Box>

                  {sec.summary && (
                    <Box
                      sx={{
                        mb: 3,
                        p: 2.5,
                        bgcolor: "rgba(25, 118, 210, 0.04)",
                        borderLeft: "4px solid",
                        borderColor: "primary.main",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: "text.primary",
                        }}
                      >
                        {sec.summary}
                      </Typography>
                    </Box>
                  )}

                  {sec.body && (
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: "text.secondary",
                      }}
                    >
                      {sec.body}
                    </Typography>
                  )}

                  {/* Subsections */}
                  {(sec.children ?? []).map((sub) => (
                    <Card
                      key={sub.id}
                      id={sub.id}
                      variant="outlined"
                      sx={{
                        mt: 3,
                        scrollMarginTop: 80,
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h4"
                          gutterBottom
                          sx={{
                            color: "primary.main",
                            fontWeight: 600,
                          }}
                        >
                          {sub.title}
                        </Typography>
                        {sub.summary && (
                          <Typography
                            variant="body1"
                            sx={{
                              mb: 2,
                              fontStyle: "italic",
                              color: "text.secondary",
                            }}
                          >
                            {sub.summary}
                          </Typography>
                        )}
                        {sub.body && (
                          <Typography
                            variant="body1"
                            sx={{ color: "text.secondary" }}
                          >
                            {sub.body}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    href="#"
                    variant="text"
                    sx={{
                      mt: 4,
                      textTransform: "none",
                      color: "primary.main",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: "rgba(25, 118, 210, 0.04)",
                      },
                    }}
                  >
                    ↑ Back to top
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ height: 60 }} />
      </Box>
    </ThemeProvider>
  );
}

export const CONTENT = {
  preface:
    "An interactive walkthrough of the proposal covering scope, methods, timeline, ethics, risks, and deliverables.",
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
