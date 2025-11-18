import { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Alert,
  Chip,
  Grid,
} from "@mui/material";
import {
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  PlayArrow,
  Search,
  Code,
  Rocket,
  Science,
} from "@mui/icons-material";
import BodyPartSelector from "./BodyPartSelector";
import BodyDiagram from "./BodyDiagram";

// Slideshow content for Overview tab
const OVERVIEW_SLIDES = [
  {
    id: 1,
    title: "What This Tool Is",
    body: "This tool is a browser-based, gesture-controlled music prototype developed as part of the PhD project Amplifying Accessibility in Artificial Music Systems at the Sonic Arts Research Centre, Queen's University Belfast. It aims to explore how digital musical instruments can become more accessible, expressive, and adaptable for disabled musicians.\n\nThe system uses webcam-based body-tracking to detect broad movements and translate them into musical control. Instead of relying on fine motor skills or conventional instrumental techniques, the tool makes use of the movements that individuals already make naturally, whether large, small, seated, standing, assisted, or asymmetrical.\n\nAt this stage, the prototype is deliberately simple and flexible. It provides a stable foundation for calibration, movement-mapping experiments, and early exploration of gesture-based interaction. It has been designed specifically to evolve: its structure and behaviours are intended to change based on upcoming workshops, user feedback, and the needs of disabled musicians.\n\nThe tool is not presented as a finished instrument. It is a research artefact — a starting point that will develop through ongoing collaboration, creative dialogue, and real-world use.",
  },
  {
    id: 2,
    title: "How Gesture Control Works",
    body: "The tool uses your webcam to estimate the position of key landmarks on the body — for example, hands, elbows, shoulders, or head. These landmarks are analysed in real time to detect relative motion, directional changes, and expressive gestures.\n\nOne of the core design principles is adaptability. Users can configure which body parts the system responds to and which parts are ignored. For some players, a single hand might feel most comfortable; for others, a combination of head and torso movement may provide richer expressive control. This flexibility allows the instrument to adapt to a wide range of physical abilities, movement ranges, and access requirements.\n\nThe movement information is translated into musical changes such as pitch range, volume shaping, texture triggering, modulation, or timbral shifts. In this early phase, mappings are intentionally clear and straightforward so musicians can easily understand how their movements influence the sound.\n\nThis approach makes the tool suitable for early co-design sessions, where simplicity and clarity help reveal what feels intuitive, what needs refining, and what creative possibilities should be developed next.",
  },
  {
    id: 3,
    title: "Why Gestures Matter for Accessible Music",
    body: "Traditional instruments — whether acoustic or digital — frequently depend on assumptions about posture, strength, dexterity, reach, and symmetrical movement. These assumptions can unintentionally exclude many disabled musicians or require them to work against their own bodies in order to participate.\n\nThis project takes an alternative perspective. Grounded in embodied music cognition and the social model of disability, it starts from the idea that musical expression arises from the movements and capabilities a person already has. Instead of imposing \"ideal\" gestures or physical expectations, the tool is designed to respond to an individual's existing movement vocabulary.\n\nGestures in this context are not prescriptive shapes. They are personal, situated, embodied actions—ranging from subtle head shifts to large sweeping arm motions. By designing an instrument around these possibilities, the tool supports creative agency in a way that puts the musician, not the technology, at the centre.\n\nThe long-term goal is to expand access to digital music-making, ensuring that diverse bodies and movement styles can participate meaningfully, comfortably, and expressively.",
  },
  {
    id: 4,
    title: "Co-Design with Drake Music NI",
    body: "This prototype is being developed with disabled musicians, not merely for them. Collaboration with Drake Music NI — including future workshops with members of the WIRED Ensemble — is a core part of how the system will grow and evolve throughout the PhD.\n\nThese workshops will focus on exploring how different musicians interact with the tool, which gestures feel natural or expressive, and how mappings should behave in rehearsal or performance conditions. Musicians will test early versions, discuss comfort, fatigue, accessibility needs, and expressive preferences, and help determine which ideas should be refined or redesigned.\n\nThis participatory approach treats disabled musicians as experts in their own creative processes. Their insights will influence everything from calibration methods and movement sensitivity to interface clarity, sound design choices, and the overall structure of future performance modes.\n\nThe aim is to ensure that the tool grows in a way that is grounded in real artistic practice, co-created with the people who will eventually perform with it.",
  },
  {
    id: 5,
    title: "What This Prototype Is (and Is Not)",
    body: "This tool is an early-stage research prototype whose purpose is exploration rather than polished performance. It is intentionally lightweight, adaptable, and open-ended so that it can be re-shaped through ongoing collaboration.\n\nWhat it is:\n• A starting point for investigating gesture-based accessible music-making\n• A system for exploring movement vocabularies, mapping strategies, and expressive possibilities\n• A foundation for co-design sessions with disabled musicians\n• A flexible environment where ideas can be tested, iterated, and adapted\n\nWhat it is not:\n• A finished digital musical instrument\n• A replacement for existing accessible music technologies\n• A fixed or prescriptive system\n• A one-size-fits-all design\n\nThis clarity is important for setting expectations before workshops begin. The prototype is part of a larger research inquiry and is expected to transform significantly as musicians contribute feedback and creative direction.",
  },
  {
    id: 6,
    title: "Accessibility & Safeguarding",
    body: "Accessibility and safeguarding are central to every stage of this project. The tool is designed to accommodate a wide range of physical, sensory, and cognitive needs. Movement sensitivity can be adjusted; different body parts can be enabled or disabled; and the interface aims to remain uncluttered, readable, and compatible with assistive technologies.\n\nAll webcam processing occurs in real time within the browser. Images are not saved, stored, transmitted, or uploaded. No biometric data is collected beyond live landmark detection, and no identifiable recordings are made.\n\nWorkshops will be conducted in partnership with Drake Music NI, who act as gatekeepers and provide support for participants' wellbeing. The project adheres to Queen's University Belfast ethics procedures, including informed consent, accessibility adjustments, safe working environments, and the right to withdraw participation at any stage.\n\nClear communication, transparency, and participant comfort are built into the entire process, ensuring that creative exploration happens within a safe and respectful environment.",
  },
  {
    id: 7,
    title: "Creative Possibilities",
    body: "Gesture-controlled sound opens pathways for musical expression that are not tied to traditional technique or instrument design. The tool enables musicians to shape sound using their own embodied movement in ways that may feel intuitive, playful, dramatic, or subtle.\n\nThis approach can support a wide range of creative goals:\n• building new performance practices around movement\n• expanding access for players who encounter physical barriers with conventional instruments\n• enabling collaborative pieces where multiple bodies influence shared sound\n• supporting improvisation through gesture-driven textures and timbres\n• integrating movement in choreography-music hybrids\n• offering alternative expressive roles in ensemble settings\n\nAs the tool develops through co-design, new artistic directions may emerge — from solo gesture performances to group interactions and staged pieces. The long-term vision is not simply to create a novel interface, but to support musicians in developing expressive, personal, embodied musical identities.",
  },
  {
    id: 8,
    title: "Future Directions & Research Development",
    body: "The prototype will evolve significantly as musicians participate in co-design sessions. Upcoming development stages will focus on:\n• refining gesture mappings and calibration workflows\n• increasing adaptability for different movement ranges\n• creating presets tailored to individual musicians\n• developing performance-oriented modes\n• improving onboarding and tutorial design\n• supporting more nuanced musical control (harmony, timbre, dynamics, layers)\n\nLater phases of the PhD will investigate how adaptive systems can support personalised interaction — for example, tools that learn which gestures a particular musician uses consistently and respond accordingly.\n\nAll future features will be guided by feedback from disabled musicians, ensuring the tool remains grounded in lived experience rather than abstract technological assumptions.",
  },
];

// Documentation sections
const DOCUMENTATION_SECTIONS = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    summary: "Clear statement of the project, who it serves, and what success looks like.",
    body: "This project develops an accessible, gesture-controlled music tool co-designed with disabled musicians, producing both a deployable instrument and a research framework for inclusive AI design.",
  },
  {
    id: "background-context",
    title: "Background & Context",
    summary: "Why accessibility in AI music tools needs an embodied, disability-led approach.",
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
    summary: "Participatory design, iterative MVP cycles, and targeted ML filtering.",
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
];

// Expandable sections for Learn More
const EXPANDABLE_SECTIONS = [
  {
    id: "research",
    title: "Research Foundations",
    content:
      "This project is grounded in embodied music cognition, disability studies, and participatory design research. It draws on scholarship exploring how musical meaning emerges through bodily engagement, how technology can amplify or constrain creative agency, and how disability-led design challenges normative assumptions about musical ability. The research adopts a critical perspective on accessible music technology, asking not only how to 'enable' participation, but how to centre disabled musicians' creativity, expertise, and self-determination. The PhD methodology involves iterative co-design, qualitative interviews, movement analysis, and reflective practice. Rather than treating technology as a neutral tool, the work examines how design decisions encode values, exclude or include particular bodies, and shape the musical possibilities available to different users.",
  },
  {
    id: "participatory",
    title: "Participatory Design with Drake Music NI",
    content:
      "Drake Music NI is a leading organisation supporting disabled musicians in Northern Ireland. Their WIRED Ensemble consists of professional disabled musicians who perform, compose, and collaborate using adaptive music technologies. This PhD project works directly with Drake Music NI members through structured workshops where musicians explore the prototype, provide feedback, and co-create new interaction possibilities. These sessions are not user-testing exercises — they are collaborative design dialogues where musicians' insights fundamentally shape the tool's evolution. Workshop themes include gesture comfort, expressive mappings, performance scenarios, and artistic goals. This approach ensures that development remains grounded in real creative practice rather than speculative assumptions about what disabled musicians 'need'.",
  },
  {
    id: "ethics",
    title: "Safeguarding, Privacy & Ethics",
    content:
      "The project follows Queen's University Belfast's ethics protocols, including informed consent, safeguarding procedures, data protection compliance, and the right to withdraw at any stage. All webcam-based tracking happens locally in the browser — no images are saved, transmitted, or stored. No biometric data is collected beyond ephemeral landmark coordinates used for real-time interaction. Workshop sessions are led in partnership with Drake Music NI, ensuring that participants have appropriate support, accessible environments, and safe working conditions. Recruitment emphasises voluntary participation and transparency about the research's scope, methods, and intended outcomes. Participants' wellbeing, creative autonomy, and comfort are prioritised throughout the project.",
  },
  {
    id: "roadmap",
    title: "Future Roadmap",
    content:
      "The tool's development follows a structured timeline aligned with the PhD schedule. Phase 1 (current) establishes the core prototype and initial co-design framework. Phase 2 will involve workshops with Drake Music NI, refining gesture mappings and calibration based on participant feedback. Phase 3 explores adaptive systems that learn from musicians' movement patterns and personalise interaction over time. Phase 4 investigates performance-oriented features, collaborative modes, and integration with live rehearsal workflows. The research aims to produce both a functional tool for disabled musicians and a set of design principles, frameworks, and insights that can guide future accessible music technology development. Outputs include the prototype itself, academic publications, workshop documentation, and guidance for inclusive music tech design.",
  },
];

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
          Interactive Demo: Body Part Selection
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
          System Architecture Diagram
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

// Overview Tab - Slideshow
function OverviewTab() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = OVERVIEW_SLIDES.length;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            mb: 1,
            color: "text.primary",
            textAlign: "center",
          }}
        >
          Project Overview
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          Section {currentSlide + 1} of {totalSlides}
        </Typography>

        <Box
          sx={{
            maxWidth: 800,
            mx: "auto",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, md: 5 },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              color: "text.primary",
              fontWeight: 600,
            }}
          >
            {OVERVIEW_SLIDES[currentSlide].title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.primary",
              lineHeight: 1.7,
              whiteSpace: "pre-line",
            }}
          >
            {OVERVIEW_SLIDES[currentSlide].body}
          </Typography>

          {/* Navigation Controls */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={handlePrevious}
              startIcon={<ChevronLeft />}
              disabled={currentSlide === 0}
              sx={{ fontSize: "0.875rem" }}
              aria-label="Previous section"
            >
              Previous
            </Button>

            <LinearProgress
              variant="determinate"
              value={((currentSlide + 1) / totalSlides) * 100}
              sx={{
                flexGrow: 1,
                mx: 3,
                height: 4,
                bgcolor: "divider",
              }}
              aria-label={`Progress: section ${currentSlide + 1} of ${totalSlides}`}
            />

            <Button
              onClick={handleNext}
              endIcon={<ChevronRight />}
              disabled={currentSlide === totalSlides - 1}
              sx={{ fontSize: "0.875rem" }}
              aria-label="Next section"
            >
              Next
            </Button>
          </Box>
        </Box>

        {/* Key Features */}
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h3"
            sx={{
              mb: 4,
              color: "text.primary",
              textAlign: "center",
            }}
          >
            Key Features
          </Typography>
          <Grid container spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
            {[
              {
                icon: <Rocket sx={{ fontSize: 24 }} />,
                title: "Accessible Design",
                description:
                  "Co-designed with disabled musicians to ensure true accessibility and usability for diverse bodies and abilities.",
              },
              {
                icon: <Science sx={{ fontSize: 24 }} />,
                title: "AI-Powered",
                description:
                  "Uses machine learning for pose detection and gesture recognition, with customizable body part tracking.",
              },
              {
                icon: <Code sx={{ fontSize: 24 }} />,
                title: "Browser-Based",
                description:
                  "No installation required. Works directly in your browser using webcam and modern web technologies.",
              },
            ].map((feature, idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Box
                  sx={{
                    p: 3,
                    height: "100%",
                    borderLeft: "3px solid",
                    borderColor: "primary.main",
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1.5,
                      color: "primary.main",
                    }}
                  >
                    {feature.icon}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        fontSize: "1rem",
                        mb: 0,
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Learn More - Expandable Sections */}
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h3"
            sx={{
              mb: 4,
              color: "text.primary",
              textAlign: "center",
            }}
          >
            Learn More
          </Typography>

          <Box sx={{ maxWidth: 900, mx: "auto" }}>
            {EXPANDABLE_SECTIONS.map((section) => (
              <Accordion
                key={section.id}
                sx={{
                  mb: 2,
                  "&:before": {
                    display: "none",
                  },
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`${section.id}-content`}
                  id={`${section.id}-header`}
                  sx={{
                    "&:hover": {
                      bgcolor: "rgba(0, 120, 212, 0.04)",
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {section.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      lineHeight: 1.7,
                    }}
                  >
                    {section.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// Documentation Tab
function DocumentationTab() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const allSections: any[] = [];

    DOCUMENTATION_SECTIONS.forEach(sec => {
      allSections.push(sec);
      if (sec.children) {
        sec.children.forEach(child => allSections.push(child));
      }
    });

    return allSections
      .filter((b) =>
        (b.title + " " + (b.body || "") + " " + (b.summary || ""))
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [query]);

  return (
    <Box sx={{ display: "flex", maxWidth: 1440, mx: "auto" }}>
      {/* Left Sidebar - Table of Contents */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          height: "calc(100vh - 200px)",
          position: "sticky",
          top: 100,
          overflowY: "auto",
          py: 3,
          px: 2,
          display: { xs: "none", md: "block" },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mb: 2,
            px: 1,
            color: "text.secondary",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.5px",
          }}
        >
          On This Page
        </Typography>
        <Stack spacing={0.5}>
          {DOCUMENTATION_SECTIONS.map((sec) => (
            <Button
              key={sec.id}
              href={`#${sec.id}`}
              sx={{
                justifyContent: "flex-start",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "text.primary",
                px: 1,
                py: 0.75,
                textAlign: "left",
                borderRadius: 1,
                textTransform: "none",
                "&:hover": {
                  bgcolor: "rgba(0, 120, 212, 0.08)",
                  color: "primary.main",
                },
              }}
            >
              {sec.title}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, px: 4, py: 4, maxWidth: 900 }}>
        {/* Title & Search */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              color: "text.primary",
              mb: 3,
            }}
          >
            Research Documentation
          </Typography>

          <TextField
            fullWidth
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 500,
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
                "& fieldset": {
                  borderColor: "divider",
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: 2,
                },
              },
            }}
          />

          {/* Search Results */}
          {query && results.length > 0 && (
            <Card sx={{ mt: 2, maxWidth: 500 }}>
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

        {/* Sections */}
        <Stack spacing={4}>
          {DOCUMENTATION_SECTIONS.map((sec) => (
            <Box
              key={sec.id}
              id={sec.id}
              sx={{
                scrollMarginTop: 110,
                pb: 4,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-child": {
                  borderBottom: "none",
                },
              }}
            >
              {/* Section Header */}
              <Typography
                variant="h4"
                sx={{
                  color: "text.primary",
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                {sec.title}
              </Typography>

              {/* Summary */}
              {sec.summary && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    bgcolor: "rgba(0, 120, 212, 0.05)",
                    border: "1px solid rgba(0, 120, 212, 0.2)",
                    "& .MuiAlert-icon": {
                      color: "primary.main",
                    },
                  }}
                >
                  {sec.summary}
                </Alert>
              )}

              {sec.body && (
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: "text.secondary",
                    lineHeight: 1.7,
                  }}
                >
                  {sec.body}
                </Typography>
              )}

              {/* Subsections */}
              {(sec.children ?? []).map((sub: any) => (
                <Box
                  key={sub.id}
                  id={sub.id}
                  sx={{
                    mt: 3,
                    ml: 2,
                    scrollMarginTop: 110,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    {sub.title}
                  </Typography>
                  {sub.body && (
                    <Typography
                      variant="body1"
                      sx={{
                        color: "text.primary",
                        mb: 2,
                        lineHeight: 1.7,
                      }}
                    >
                      {sub.body}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// Interactive Demos Tab
function InteractiveDemosTab() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 600,
          mb: 2,
          textAlign: "center",
          color: "text.primary",
        }}
      >
        Interactive Demos
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 5,
          color: "text.secondary",
          fontSize: "1.125rem",
          textAlign: "center",
        }}
      >
        Explore the core features of the system with these interactive demonstrations.
      </Typography>

      <Box sx={{ maxWidth: 900, mx: "auto" }}>
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
              bgcolor: "primary.main",
              color: "white",
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            Launch Full Demo
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function AboutPage() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 900, mx: "auto", textAlign: "center" }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontSize: { xs: "2rem", md: "2.5rem" },
                fontWeight: 600,
                mb: 2,
                color: "text.primary",
              }}
            >
              Amplifying Accessibility in Artificial Music Systems
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: "text.secondary",
                fontSize: "1.125rem",
                lineHeight: 1.7,
              }}
            >
              This browser-based music tool is part of the PhD project{" "}
              <em>Amplifying Accessibility in Artificial Music Systems</em> at
              Queen's University Belfast. It uses webcam-based gesture tracking
              to explore how disabled musicians can shape expressive, digital
              instruments around their own movements, in collaboration with Drake
              Music NI.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                component={RouterLink}
                to="/"
                startIcon={<PlayArrow />}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  px: 3,
                  py: 1.25,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                }}
              >
                Try the Prototype
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Tabs Navigation */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            centered
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minHeight: 48,
                px: 3,
                "&.Mui-selected": {
                  color: "primary.main",
                },
                "&:hover": {
                  color: "primary.main",
                  bgcolor: "rgba(0, 120, 212, 0.04)",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 2,
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Documentation" />
            <Tab label="Interactive Demos" />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && <OverviewTab />}
      {currentTab === 1 && <DocumentationTab />}
      {currentTab === 2 && <InteractiveDemosTab />}

      {/* Footer Section */}
      <Box
        sx={{
          py: 6,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Contact & Questions
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This project is conducted at the{" "}
              <strong>Sonic Arts Research Centre</strong>, Queen's University
              Belfast, in collaboration with <strong>Drake Music NI</strong>.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button
                variant="text"
                size="small"
                sx={{ fontSize: "0.875rem" }}
                href="https://www.qub.ac.uk/sarc/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Queen's University Belfast SARC
              </Button>
              <Button
                variant="text"
                size="small"
                sx={{ fontSize: "0.875rem" }}
                href="https://www.drakemusicni.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Drake Music NI
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default AboutPage;
