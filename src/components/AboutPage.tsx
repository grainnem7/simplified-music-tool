import React, { useState } from "react";
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
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  PlayArrow,
} from "@mui/icons-material";

// Slideshow content structure
const TOUR_SLIDES = [
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
    body: "Traditional instruments — whether acoustic or digital — frequently depend on assumptions about posture, strength, dexterity, reach, and symmetrical movement. These assumptions can unintentionally exclude many disabled musicians or require them to work against their own bodies in order to participate.\n\nThis project takes an alternative perspective. Grounded in embodied music cognition and the social model of disability, it starts from the idea that musical expression arises from the movements and capabilities a person already has. Instead of imposing "ideal" gestures or physical expectations, the tool is designed to respond to an individual's existing movement vocabulary.\n\nGestures in this context are not prescriptive shapes. They are personal, situated, embodied actions—ranging from subtle head shifts to large sweeping arm motions. By designing an instrument around these possibilities, the tool supports creative agency in a way that puts the musician, not the technology, at the centre.\n\nThe long-term goal is to expand access to digital music-making, ensuring that diverse bodies and movement styles can participate meaningfully, comfortably, and expressively.",
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

function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = TOUR_SLIDES.length;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const scrollToTour = () => {
    document.getElementById("guided-tour")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToResearch = () => {
    document.getElementById("expandable-sections")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 900 }}>
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                onClick={scrollToTour}
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
                Start Guided Tour
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
                sx={{
                  px: 3,
                  py: 1.25,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                }}
              >
                Try the Prototype
              </Button>
              <Button
                variant="text"
                onClick={scrollToResearch}
                sx={{
                  px: 3,
                  py: 1.25,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                }}
              >
                Learn About the Research
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Guided Tour / Slideshow */}
      <Box
        id="guided-tour"
        sx={{
          py: 8,
          scrollMarginTop: 100,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              mb: 1,
              color: "text.primary",
              textAlign: "center",
            }}
          >
            Guided Tour
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 4,
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            Slide {currentSlide + 1} of {totalSlides}
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
              {TOUR_SLIDES[currentSlide].title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {TOUR_SLIDES[currentSlide].body}
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
                aria-label="Previous slide"
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
                aria-label={`Progress: slide ${currentSlide + 1} of ${totalSlides}`}
              />

              <Button
                onClick={handleNext}
                endIcon={<ChevronRight />}
                disabled={currentSlide === totalSlides - 1}
                sx={{ fontSize: "0.875rem" }}
                aria-label="Next slide"
              >
                Next
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Expandable Sections */}
      <Box
        id="expandable-sections"
        sx={{
          py: 8,
          bgcolor: "background.paper",
          scrollMarginTop: 100,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              mb: 4,
              color: "text.primary",
            }}
          >
            Learn More
          </Typography>

          <Box sx={{ maxWidth: 900 }}>
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
        </Container>
      </Box>

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
          <Stack spacing={3}>
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/proposal"
                variant="outlined"
                size="small"
                sx={{ fontSize: "0.875rem" }}
              >
                Research Overview
              </Button>
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
