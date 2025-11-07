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
  Alert,
  Chip,
  Tabs,
  Tab,
  Container,
  Grid,
} from "@mui/material";
import {
  Home,
  Print,
  Search,
  KeyboardArrowRight,
  Code,
  MenuBook,
  Rocket,
  Science,
  Info,
} from "@mui/icons-material";
import BodyPartSelector from "./BodyPartSelector";
import BodyDiagram from "./BodyDiagram";

export type GuideBlock = {
  id: string;
  title: string;
  kind?: "section" | "subsection" | "appendix";
  summary?: string;
  body?: string;
  children?: GuideBlock[];
  demo?: "body-tracking" | "system-diagram";
};

export type GuideContent = {
  preface?: string;
  sections: GuideBlock[];
};

// Modern, clean theme with vibrant accents
const theme = createTheme({
  palette: {
    primary: {
      main: "#6366f1", // Indigo
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      main: "#10b981", // Emerald
      light: "#34d399",
      dark: "#059669",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h2: {
      fontSize: "2.5rem",
      fontWeight: 800,
      marginBottom: "1rem",
      letterSpacing: "-0.03em",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      marginBottom: "0.75rem",
      letterSpacing: "-0.02em",
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      marginBottom: "0.5rem",
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1.0625rem",
      lineHeight: 1.75,
      color: "#475569",
    },
    subtitle1: {
      fontSize: "1.125rem",
      lineHeight: 1.6,
      color: "#64748b",
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
          fontWeight: 600,
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

// Interactive demo component for body tracking
function BodyTrackingDemo() {
  const [selectedParts, setSelectedParts] = useState<string[]>([
    "leftWrist",
    "rightWrist",
  ]);

  return (
    <Box
      sx={{
        my: 4,
        p: 4,
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        border: "3px solid #38bdf8",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(56, 189, 248, 0.15)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            bgcolor: "#38bdf8",
            color: "white",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Code />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#0c4a6e",
            fontSize: "1.125rem",
          }}
        >
          🎮 Interactive Demo: Body Part Selection
        </Typography>
      </Stack>
      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: "rgba(56, 189, 248, 0.1)",
          border: "1px solid #7dd3fc",
          "& .MuiAlert-icon": {
            color: "#0284c7",
          },
        }}
      >
        This is a live demo of the body tracking interface. Try selecting
        different body parts to see how the system allows users to customize
        which movements are tracked.
      </Alert>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Body Part Selector
          </Typography>
          <BodyPartSelector
            selectedParts={selectedParts}
            onSelectionChange={setSelectedParts}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Visual Feedback
          </Typography>
          <BodyDiagram selectedParts={selectedParts} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Selected: {selectedParts.length} body parts
            </Typography>
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selectedParts.map((part) => (
                <Chip
                  key={part}
                  label={part}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// System architecture diagram
function SystemDiagramDemo() {
  return (
    <Box
      sx={{
        my: 4,
        p: 4,
        background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
        border: "3px solid #a78bfa",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(167, 139, 250, 0.15)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            bgcolor: "#a78bfa",
            color: "white",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Code />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#581c87",
            fontSize: "1.125rem",
          }}
        >
          🔄 System Architecture Diagram
        </Typography>
      </Stack>
      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: "rgba(167, 139, 250, 0.1)",
          border: "1px solid #c4b5fd",
          "& .MuiAlert-icon": {
            color: "#7c3aed",
          },
        }}
      >
        This diagram shows the data flow from webcam input through pose
        detection to musical output.
      </Alert>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
        {[
          {
            label: "Webcam Input",
            desc: "Real-time video capture",
            color: "#4caf50",
          },
          { label: "↓", desc: "", color: "transparent" },
          {
            label: "Pose Detection (MoveNet)",
            desc: "Extract body keypoints",
            color: "#2196f3",
          },
          { label: "↓", desc: "", color: "transparent" },
          {
            label: "Movement Mapping",
            desc: "Map positions to musical parameters",
            color: "#ff9800",
          },
          { label: "↓", desc: "", color: "transparent" },
          {
            label: "Sound Engine (Tone.js)",
            desc: "Generate music output",
            color: "#9c27b0",
          },
        ].map((step, idx) =>
          step.label === "↓" ? (
            <Typography key={idx} variant="h4" sx={{ my: -1 }}>
              ↓
            </Typography>
          ) : (
            <Card
              key={idx}
              sx={{
                width: "100%",
                maxWidth: 500,
                bgcolor: step.color,
                color: "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {step.label}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {step.desc}
                </Typography>
              </CardContent>
            </Card>
          )
        )}
      </Box>
    </Box>
  );
}

// Render demo based on type
function DemoRenderer({ type }: { type: "body-tracking" | "system-diagram" }) {
  switch (type) {
    case "body-tracking":
      return <BodyTrackingDemo />;
    case "system-diagram":
      return <SystemDiagramDemo />;
    default:
      return null;
  }
}

// Interactive Demo Tab
function InteractiveDemoTab() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          mb: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Try the Interactive Demos
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 5,
          color: "text.secondary",
          fontSize: "1.125rem",
        }}
      >
        Explore the core features of the system with these interactive demonstrations.
      </Typography>

      <Stack spacing={6}>
        <BodyTrackingDemo />
        <SystemDiagramDemo />
      </Stack>

      <Box
        sx={{
          mt: 6,
          p: 4,
          bgcolor: "#f8fafc",
          border: "2px solid #e2e8f0",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Ready to try the full application?
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: 700,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
            },
            transition: "all 0.2s",
          }}
        >
          Launch Full Demo →
        </Button>
      </Box>
    </Container>
  );
}

// Landing page component
function LandingPage({ projectTitle }: { projectTitle: string }) {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 800,
              mb: 3,
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {projectTitle}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              opacity: 0.95,
              fontWeight: 400,
              maxWidth: "800px",
              mx: "auto",
            }}
          >
            An accessible, gesture-controlled music tool co-designed with
            disabled musicians
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "#667eea",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "#f8fafc",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s",
              }}
            >
              Try the Live Demo →
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Feature Cards */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <Rocket sx={{ fontSize: 40 }} />,
              title: "Accessible Design",
              description:
                "Co-designed with disabled musicians to ensure true accessibility and usability for diverse bodies and abilities.",
              color: "#667eea",
            },
            {
              icon: <Science sx={{ fontSize: 40 }} />,
              title: "AI-Powered",
              description:
                "Uses machine learning for pose detection and gesture recognition, with customizable body part tracking.",
              color: "#10b981",
            },
            {
              icon: <Code sx={{ fontSize: 40 }} />,
              title: "Browser-Based",
              description:
                "No installation required. Works directly in your browser using webcam and modern web technologies.",
              color: "#f59e0b",
            },
          ].map((feature, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: "text.primary",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.7,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        <Box sx={{ mt: 8, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 4,
              color: "text.primary",
            }}
          >
            Project Overview
          </Typography>
          <Grid container spacing={4}>
            {[
              { label: "Body Parts Tracked", value: "14+" },
              { label: "Research Phases", value: "3" },
              { label: "Technology Stack", value: "React + ML" },
            ].map((stat, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: "#667eea",
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export default function ProposalGuide({
  content,
  projectTitle,
}: {
  content: GuideContent;
  projectTitle: string;
}) {
  const [currentTab, setCurrentTab] = useState(0);
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, pt: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <MenuBook /> Research Proposal
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  component={RouterLink}
                  to="/"
                  startIcon={<Home />}
                  sx={{
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    px: 2,
                    py: 0.75,
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.15)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                >
                  Home
                </Button>
                <IconButton
                  onClick={() => window.print()}
                  sx={{
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.15)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  }}
                  aria-label="Print documentation"
                >
                  <Print />
                </IconButton>
              </Stack>
            </Stack>

            {/* Tabs */}
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              sx={{
                "& .MuiTab-root": {
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  minHeight: 48,
                  "&.Mui-selected": {
                    color: "white",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "white",
                  height: 3,
                },
              }}
            >
              <Tab icon={<Info />} iconPosition="start" label="Overview" />
              <Tab icon={<MenuBook />} iconPosition="start" label="Documentation" />
              <Tab icon={<Code />} iconPosition="start" label="Interactive Demo" />
            </Tabs>
          </Box>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && <LandingPage projectTitle={projectTitle} />}

        {currentTab === 1 && (
          <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, py: 6 }}>
            {/* Title & Search */}
            <Box sx={{ mb: 6 }}>
            <Box
              sx={{
                mb: 4,
                pb: 4,
                borderBottom: "2px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: "text.primary",
                  mb: 2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {projectTitle}
              </Typography>
              {content.preface && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "text.secondary",
                    maxWidth: "750px",
                  }}
                >
                  {content.preface}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 650,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "white",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  border: "2px solid transparent",
                  "& fieldset": {
                    border: "2px solid #e2e8f0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#94a3b8",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)",
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
              mb: 6,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                px: 4,
                py: 3,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1.5rem",
                }}
              >
                📑 Table of Contents
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              <Stack spacing={0}>
                {content.sections.map((sec, idx) => (
                  <Button
                    key={sec.id}
                    href={`#${sec.id}`}
                    sx={{
                      justifyContent: "flex-start",
                      fontSize: "1.0625rem",
                      py: 2.5,
                      px: 4,
                      textAlign: "left",
                      fontWeight: 500,
                      color: "text.primary",
                      borderBottom: "1px solid #e2e8f0",
                      borderRadius: 0,
                      "&:last-child": {
                        borderBottom: "none",
                      },
                      "&:hover": {
                        bgcolor: "#f8fafc",
                        "& .toc-number": {
                          bgcolor: "#6366f1",
                          transform: "scale(1.1)",
                        },
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <Box
                      className="toc-number"
                      sx={{
                        bgcolor: "#e0e7ff",
                        color: "#4f46e5",
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        mr: 2.5,
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "1.0625rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {sec.title}
                      </Typography>
                    </Box>
                    <KeyboardArrowRight
                      sx={{
                        ml: 2,
                        color: "#94a3b8",
                        opacity: 0,
                        transition: "all 0.2s",
                        ".MuiButton-root:hover &": {
                          opacity: 1,
                          transform: "translateX(4px)",
                        },
                      }}
                    />
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Sections */}
          <Stack spacing={6}>
            {content.sections.map((sec, idx) => (
              <Card
                key={sec.id}
                id={sec.id}
                sx={{
                  bgcolor: "white",
                  scrollMarginTop: 100,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Section Header Bar */}
                <Box
                  sx={{
                    background: `linear-gradient(135deg, ${
                      ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"][idx % 7]
                    } 0%, ${
                      ["#764ba2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0d9488"][idx % 7]
                    } 100%)`,
                    px: 4,
                    py: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "white",
                      minWidth: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "white",
                      fontSize: "1.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {sec.title}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 4 }}>
                  {sec.summary && (
                    <Box
                      sx={{
                        mb: 3,
                        p: 3,
                        bgcolor: "#f8fafc",
                        borderLeft: "4px solid",
                        borderColor: `${
                          ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"][idx % 7]
                        }`,
                        borderRadius: "0 4px 4px 0",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "1.0625rem",
                        }}
                      >
                        💡 {sec.summary}
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

                  {/* Interactive Demo */}
                  {sec.demo && <DemoRenderer type={sec.demo} />}

                  {/* Subsections */}
                  {(sec.children ?? []).map((sub, subIdx) => (
                    <Card
                      key={sub.id}
                      id={sub.id}
                      sx={{
                        mt: 3,
                        scrollMarginTop: 100,
                        border: "2px solid #e2e8f0",
                        bgcolor: "#fafbfc",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "#cbd5e1",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: "#e0e7ff",
                              color: "#4f46e5",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}.{subIdx + 1}
                          </Box>
                          <Typography
                            variant="h4"
                            sx={{
                              color: "#4f46e5",
                              fontWeight: 700,
                              fontSize: "1.25rem",
                            }}
                          >
                            {sub.title}
                          </Typography>
                        </Box>
                        {sub.summary && (
                          <Typography
                            variant="body1"
                            sx={{
                              mb: 2,
                              fontStyle: "italic",
                              color: "#64748b",
                              fontSize: "1rem",
                              pl: 5,
                            }}
                          >
                            {sub.summary}
                          </Typography>
                        )}
                        {sub.body && (
                          <Typography
                            variant="body1"
                            sx={{
                              color: "#475569",
                              fontSize: "1.0625rem",
                              lineHeight: 1.75,
                              pl: 5,
                            }}
                          >
                            {sub.body}
                          </Typography>
                        )}
                        {/* Interactive Demo in subsection */}
                        {sub.demo && (
                          <Box sx={{ pl: 5 }}>
                            <DemoRenderer type={sub.demo} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <Box
                    sx={{
                      mt: 4,
                      pt: 3,
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      href="#"
                      variant="outlined"
                      sx={{
                        color: "#6366f1",
                        borderColor: "#e0e7ff",
                        bgcolor: "#f8fafc",
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                        "&:hover": {
                          bgcolor: "#e0e7ff",
                          borderColor: "#6366f1",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.2s",
                      }}
                    >
                      ↑ Back to Top
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
          </Box>
        )}

        {currentTab === 2 && <InteractiveDemoTab />}

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
      demo: "body-tracking",
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
          demo: "system-diagram",
        },
      ],
    },
  ],
};
