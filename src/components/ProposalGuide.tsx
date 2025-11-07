import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Collapse,
  Divider,
  Breadcrumbs,
  Link,
  Paper,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CssBaseline,
  ThemeProvider,
  createTheme,
  alpha,
} from "@mui/material";
import {
  Home,
  Print,
  Search,
  ExpandMore,
  ChevronRight,
  Link as LinkIcon,
  Description,
  CheckCircle,
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

const DRAWER_WIDTH = 340;

// Custom professional theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: "2rem",
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.125rem",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
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
          backgroundColor: "primary.light",
          color: "white",
          px: 0.5,
          fontWeight: 600,
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
        if (b.children && findParents(b.children, [...trail, b.id]))
          return true;
      }
      return false;
    }
    findParents(content.sections);
    if (parents.size) {
      setExpanded((e) => ({
        ...e,
        ...Array.from(parents).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
      }));
    }
  }, [hash, content.sections]);

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
        snippet: (b.body || b.summary || "").slice(0, 150),
        score:
          (
            (b.title + " " + (b.body || "") + " " + (b.summary || ""))
              .toLowerCase()
              .match(new RegExp(q, "g")) || []
          ).length,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(({ id, title, snippet }) => ({ id, title, snippet }));
  }, [query, all]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* AppBar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: "white",
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Breadcrumbs sx={{ flexGrow: 1 }}>
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                color="inherit"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontWeight: 500,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Home fontSize="small" />
                Home
              </Link>
              <Typography color="text.primary" fontWeight={600}>
                Proposal
              </Typography>
            </Breadcrumbs>
            <Button
              startIcon={<Print />}
              onClick={() => window.print()}
              variant="outlined"
              size="medium"
              sx={{ minWidth: 140 }}
            >
              Print / Export
            </Button>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: "auto", height: "100%" }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}
              >
                {projectTitle}
              </Typography>
              {content.preface && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {content.preface}
                </Typography>
              )}
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search the guide..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.default",
                  },
                }}
              />
            </Box>

            {query && results.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mx: 2,
                  mb: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ p: 1.5, pb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "primary.main",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {results.length} Match{results.length !== 1 ? "es" : ""}
                  </Typography>
                </Box>
                <List dense disablePadding>
                  {results.map((r) => (
                    <ListItem key={r.id} disablePadding>
                      <ListItemButton component="a" href={`#${r.id}`}>
                        <ListItemText
                          primary={highlight(r.title, query)}
                          secondary={highlight(r.snippet || "", query)}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <List disablePadding>
              {content.sections.map((sec, idx) => (
                <Box key={sec.id}>
                  <ListItemButton
                    onClick={() => toggle(sec.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        gap: 1.5,
                      }}
                    >
                      <Chip
                        label={idx + 1}
                        size="small"
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                          minWidth: 32,
                        }}
                      />
                      <ListItemText
                        primary={sec.title}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      />
                      {expanded[sec.id] ? (
                        <ExpandMore sx={{ color: "primary.main" }} />
                      ) : (
                        <ChevronRight sx={{ color: "text.secondary" }} />
                      )}
                    </Box>
                  </ListItemButton>
                  <Collapse in={expanded[sec.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding dense>
                      <ListItemButton
                        component="a"
                        href={`#${sec.id}`}
                        sx={{ pl: 7, py: 1 }}
                      >
                        <Description fontSize="small" sx={{ mr: 1.5, color: "primary.main" }} />
                        <ListItemText
                          primary="Overview"
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItemButton>
                      {(sec.children ?? []).map((sub) => (
                        <ListItemButton
                          key={sub.id}
                          component="a"
                          href={`#${sub.id}`}
                          sx={{ pl: 7, py: 1 }}
                        >
                          <CheckCircle fontSize="small" sx={{ mr: 1.5, color: "action.active" }} />
                          <ListItemText
                            primary={sub.title}
                            primaryTypographyProps={{ variant: "body2" }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                  <Divider />
                </Box>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            overflow: "auto",
            bgcolor: "background.default",
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 2 }}>
            {content.sections.map((sec) => (
              <Section key={sec.id} block={sec} query={query} />
            ))}
          </Container>
        </Box>
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
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Paper
      id={block.id}
      elevation={0}
      sx={{
        mb: 4,
        p: 4,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          pb: 2,
          borderBottom: 2,
          borderColor: "primary.main",
        }}
      >
        <Typography variant="h4" component="h2" sx={{ color: "primary.dark" }}>
          {highlight(block.title, query)}
        </Typography>
        <Button
          size="small"
          startIcon={copied ? <CheckCircle /> : <LinkIcon />}
          onClick={copy}
          variant={copied ? "contained" : "outlined"}
          sx={{ minWidth: 120 }}
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </Box>

      {block.summary && (
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderLeft: 3,
            borderColor: "primary.main",
            fontStyle: "italic",
          }}
        >
          {highlight(block.summary, query)}
        </Typography>
      )}

      {block.body && (
        <Typography variant="body1" sx={{ mb: 3, color: "text.primary" }}>
          {highlight(block.body, query)}
        </Typography>
      )}

      {(block.children ?? []).map((sub) => (
        <SubSection key={sub.id} block={sub} query={query} />
      ))}
    </Paper>
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
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Accordion
      defaultExpanded
      id={block.id}
      elevation={0}
      sx={{
        mb: 2,
        border: 1,
        borderColor: "divider",
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0, mb: 2 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
        }}
      >
        <Typography variant="h6" sx={{ color: "primary.dark" }}>
          {highlight(block.title, query)}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {block.summary && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontStyle: "italic" }}
          >
            {highlight(block.summary, query)}
          </Typography>
        )}

        {block.body && (
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            {highlight(block.body, query)}
          </Typography>
        )}

        <Button
          size="small"
          startIcon={copied ? <CheckCircle /> : <LinkIcon />}
          onClick={copy}
          variant={copied ? "contained" : "text"}
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}

export const CONTENT = {
  preface:
    "An interactive, thorough walkthrough of the proposal: scope, methods, timeline, ethics, risks, and deliverables. Click any section for details or share deep links with the committee.",
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
