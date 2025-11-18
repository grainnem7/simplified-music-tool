import { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material'
import {
  Close,
  ExpandMore,
  Save,
  RestartAlt,
  MusicNote,
  Tune,
  Piano,
  Visibility,
} from '@mui/icons-material'
import {
  useMusicSettings,
  SCALES,
  CHORD_PROGRESSIONS,
  DEFAULT_PRESETS,
  SYNTH_TYPES,
  FILTER_TYPES,
  BodyPartRole,
  ScaleType,
  ChordProgressionType,
  SynthType,
  FilterType,
} from '../contexts/MusicSettingsContext'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const BODY_PART_LABELS: Record<string, string> = {
  rightWrist: 'Right Wrist',
  rightElbow: 'Right Elbow',
  rightShoulder: 'Right Shoulder',
  rightHip: 'Right Hip',
  rightKnee: 'Right Knee',
  rightAnkle: 'Right Ankle',
  leftWrist: 'Left Wrist',
  leftElbow: 'Left Elbow',
  leftShoulder: 'Left Shoulder',
  leftHip: 'Left Hip',
  leftKnee: 'Left Knee',
  leftAnkle: 'Left Ankle',
  nose: 'Head',
}

function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    settings,
    updateSettings,
    updateBodyPartConfig,
    loadPreset,
    savePreset,
    getSavedPresets,
    deleteSavedPreset,
    resetToDefault,
  } = useMusicSettings()

  const [currentTab, setCurrentTab] = useState(0)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim(), presetDescription.trim())
      setSaveDialogOpen(false)
      setPresetName('')
      setPresetDescription('')
    }
  }

  const savedPresets = getSavedPresets()

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, p: 0 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Settings
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Tabs
            value={currentTab}
            onChange={(_, v) => setCurrentTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Tune />} label="Sensitivity" sx={{ minHeight: 64 }} />
            <Tab icon={<Piano />} label="Musical" sx={{ minHeight: 64 }} />
            <Tab icon={<MusicNote />} label="Body Parts" sx={{ minHeight: 64 }} />
            <Tab icon={<Visibility />} label="Display" sx={{ minHeight: 64 }} />
          </Tabs>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {/* Sensitivity Tab */}
            {currentTab === 0 && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Movement Sensitivity
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Lower = more sensitive to small movements
                  </Typography>
                  <Slider
                    value={settings.movementThreshold}
                    onChange={(_, v) => updateSettings({ movementThreshold: v as number })}
                    min={0.005}
                    max={0.05}
                    step={0.001}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 1000).toFixed(1)}`}
                    marks={[
                      { value: 0.005, label: 'High' },
                      { value: 0.025, label: 'Med' },
                      { value: 0.05, label: 'Low' },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Pose Confidence Threshold
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Higher = stricter detection, fewer false triggers
                  </Typography>
                  <Slider
                    value={settings.confidenceThreshold}
                    onChange={(_, v) => updateSettings({ confidenceThreshold: v as number })}
                    min={0.1}
                    max={0.6}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                    marks={[
                      { value: 0.1, label: 'Low' },
                      { value: 0.35, label: 'Med' },
                      { value: 0.6, label: 'High' },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Note Interval
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Minimum time between notes (ms)
                  </Typography>
                  <Slider
                    value={settings.noteInterval}
                    onChange={(_, v) => updateSettings({ noteInterval: v as number })}
                    min={100}
                    max={500}
                    step={25}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${v}ms`}
                    marks={[
                      { value: 100, label: 'Fast' },
                      { value: 300, label: 'Med' },
                      { value: 500, label: 'Slow' },
                    ]}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Presets
                  </Typography>
                  <Stack spacing={1}>
                    {Object.entries(DEFAULT_PRESETS).map(([id, preset]) => (
                      <Button
                        key={id}
                        variant="outlined"
                        size="small"
                        onClick={() => loadPreset(id)}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {preset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {preset.description}
                          </Typography>
                        </Box>
                      </Button>
                    ))}
                  </Stack>

                  {Object.keys(savedPresets).length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Saved Presets
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(savedPresets).map(([id, preset]) => (
                          <Box key={id} sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => loadPreset(id)}
                              sx={{ flex: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                            >
                              {preset.name}
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => deleteSavedPreset(id)}
                              color="error"
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </Box>
              </Stack>
            )}

            {/* Musical Tab */}
            {currentTab === 1 && (
              <Stack spacing={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Scale</InputLabel>
                  <Select
                    value={settings.scale}
                    label="Scale"
                    onChange={(e) => updateSettings({ scale: e.target.value as ScaleType })}
                  >
                    {Object.entries(SCALES).map(([id, scale]) => (
                      <MenuItem key={id} value={id}>
                        {scale.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Root Note</InputLabel>
                  <Select
                    value={settings.rootNote}
                    label="Root Note"
                    onChange={(e) => updateSettings({ rootNote: e.target.value })}
                  >
                    {ROOT_NOTES.map((note) => (
                      <MenuItem key={note} value={note}>
                        {note}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Chord Progression</InputLabel>
                  <Select
                    value={settings.chordProgression}
                    label="Chord Progression"
                    onChange={(e) => updateSettings({ chordProgression: e.target.value as ChordProgressionType })}
                  >
                    {Object.entries(CHORD_PROGRESSIONS).map(([id, prog]) => (
                      <MenuItem key={id} value={id}>
                        <Box>
                          <Typography variant="body2">{prog.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prog.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tempo Range (BPM)
                  </Typography>
                  <Slider
                    value={settings.tempoRange}
                    onChange={(_, v) => updateSettings({ tempoRange: v as [number, number] })}
                    min={40}
                    max={180}
                    step={5}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 40, label: '40' },
                      { value: 110, label: '110' },
                      { value: 180, label: '180' },
                    ]}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Reverb
                  </Typography>
                  <Slider
                    value={settings.reverbAmount}
                    onChange={(_, v) => updateSettings({ reverbAmount: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Delay
                  </Typography>
                  <Slider
                    value={settings.delayAmount}
                    onChange={(_, v) => updateSettings({ delayAmount: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter Brightness
                  </Typography>
                  <Slider
                    value={settings.filterFrequency}
                    onChange={(_, v) => updateSettings({ filterFrequency: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v < 0.3 ? 'Dark' : v > 0.7 ? 'Bright' : 'Warm'}
                  />
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Filter Type</InputLabel>
                  <Select
                    value={settings.filterType}
                    label="Filter Type"
                    onChange={(e) => updateSettings({ filterType: e.target.value as FilterType })}
                  >
                    {Object.entries(FILTER_TYPES).map(([id, filter]) => (
                      <MenuItem key={id} value={id}>
                        <Box>
                          <Typography variant="body2">{filter.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {filter.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Instrument Sounds
                </Typography>

                <FormControl fullWidth size="small">
                  <InputLabel>Melodic Synth</InputLabel>
                  <Select
                    value={settings.melodicSynthType}
                    label="Melodic Synth"
                    onChange={(e) => updateSettings({ melodicSynthType: e.target.value as SynthType })}
                  >
                    {Object.entries(SYNTH_TYPES).map(([id, synth]) => (
                      <MenuItem key={id} value={id}>
                        <Box>
                          <Typography variant="body2">{synth.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {synth.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Bass Synth</InputLabel>
                  <Select
                    value={settings.bassSynthType}
                    label="Bass Synth"
                    onChange={(e) => updateSettings({ bassSynthType: e.target.value as SynthType })}
                  >
                    {Object.entries(SYNTH_TYPES).map(([id, synth]) => (
                      <MenuItem key={id} value={id}>
                        <Box>
                          <Typography variant="body2">{synth.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {synth.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Chord Synth</InputLabel>
                  <Select
                    value={settings.chordSynthType}
                    label="Chord Synth"
                    onChange={(e) => updateSettings({ chordSynthType: e.target.value as SynthType })}
                  >
                    {Object.entries(SYNTH_TYPES).map(([id, synth]) => (
                      <MenuItem key={id} value={id}>
                        <Box>
                          <Typography variant="body2">{synth.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {synth.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Envelope
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Attack Time (how quickly notes start)
                  </Typography>
                  <Slider
                    value={settings.attackTime}
                    onChange={(_, v) => updateSettings({ attackTime: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v < 0.2 ? 'Snappy' : v > 0.6 ? 'Slow' : 'Normal'}
                    marks={[
                      { value: 0, label: 'Fast' },
                      { value: 0.5, label: 'Med' },
                      { value: 1, label: 'Slow' },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Release Time (how notes fade out)
                  </Typography>
                  <Slider
                    value={settings.releaseTime}
                    onChange={(_, v) => updateSettings({ releaseTime: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v < 0.3 ? 'Short' : v > 0.7 ? 'Long' : 'Normal'}
                    marks={[
                      { value: 0, label: 'Short' },
                      { value: 0.5, label: 'Med' },
                      { value: 1, label: 'Long' },
                    ]}
                  />
                </Box>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Expression
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Vibrato Depth
                  </Typography>
                  <Slider
                    value={settings.vibratoDepth}
                    onChange={(_, v) => updateSettings({ vibratoDepth: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v === 0 ? 'Off' : `${(v * 100).toFixed(0)}%`}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Vibrato Rate
                  </Typography>
                  <Slider
                    value={settings.vibratoRate}
                    onChange={(_, v) => updateSettings({ vibratoRate: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(1 + v * 9).toFixed(0)} Hz`}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Portamento (glide between notes)
                  </Typography>
                  <Slider
                    value={settings.portamento}
                    onChange={(_, v) => updateSettings({ portamento: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v === 0 ? 'Off' : v < 0.3 ? 'Subtle' : v > 0.7 ? 'Long' : 'Med'}
                  />
                </Box>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Dynamics & Rhythm
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Dynamics Range (min/max volume)
                  </Typography>
                  <Slider
                    value={settings.dynamicsRange}
                    onChange={(_, v) => updateSettings({ dynamicsRange: v as [number, number] })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Swing Amount
                  </Typography>
                  <Slider
                    value={settings.swingAmount}
                    onChange={(_, v) => updateSettings({ swingAmount: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v === 0 ? 'Straight' : v > 0.6 ? 'Heavy' : 'Light'}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Harmonic Richness
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Adds overtones and depth to the sound
                  </Typography>
                  <Slider
                    value={settings.harmonicRichness}
                    onChange={(_, v) => updateSettings({ harmonicRichness: v as number })}
                    min={0}
                    max={1}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => v < 0.3 ? 'Pure' : v > 0.7 ? 'Rich' : 'Balanced'}
                  />
                </Box>
              </Stack>
            )}

            {/* Body Parts Tab */}
            {currentTab === 2 && (
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Configure how each body part controls the music
                </Typography>

                {Object.entries(BODY_PART_LABELS).map(([partId, label]) => {
                  const config = settings.bodyPartConfigs[partId]
                  if (!config) return null

                  return (
                    <Accordion key={partId} disableGutters>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {label}
                          </Typography>
                          <Chip
                            label={config.role}
                            size="small"
                            color={
                              config.role === 'melodic' ? 'primary' :
                              config.role === 'bass' ? 'secondary' :
                              config.role === 'chord' ? 'success' : 'default'
                            }
                            variant={config.role === 'disabled' ? 'outlined' : 'filled'}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Role</InputLabel>
                            <Select
                              value={config.role}
                              label="Role"
                              onChange={(e) => {
                                const newRole = e.target.value as BodyPartRole
                                // Set appropriate octave range defaults for the new role
                                let octaveRange: [number, number] = config.octaveRange
                                if (newRole === 'bass') {
                                  octaveRange = [1, 3] // Low octaves for bass
                                } else if (newRole === 'melodic') {
                                  octaveRange = [4, 6] // High octaves for melodic
                                } else if (newRole === 'chord') {
                                  octaveRange = [2, 4] // Mid octaves for chords
                                }
                                updateBodyPartConfig(partId, { role: newRole, octaveRange })
                              }}
                            >
                              <MenuItem value="melodic">Melodic</MenuItem>
                              <MenuItem value="bass">Bass</MenuItem>
                              <MenuItem value="chord">Chord</MenuItem>
                              <MenuItem value="disabled">Disabled</MenuItem>
                            </Select>
                          </FormControl>

                          {config.role !== 'disabled' && (
                            <>
                              <Box>
                                <Typography variant="caption" gutterBottom display="block">
                                  Octave Range
                                </Typography>
                                <Slider
                                  value={config.octaveRange}
                                  onChange={(_, v) => updateBodyPartConfig(partId, { octaveRange: v as [number, number] })}
                                  min={1}
                                  max={7}
                                  step={1}
                                  valueLabelDisplay="auto"
                                  marks
                                />
                              </Box>

                              <Box>
                                <Typography variant="caption" gutterBottom display="block">
                                  Sensitivity Multiplier
                                </Typography>
                                <Slider
                                  value={config.sensitivity}
                                  onChange={(_, v) => updateBodyPartConfig(partId, { sensitivity: v as number })}
                                  min={0.5}
                                  max={2}
                                  step={0.1}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(v) => `${v}x`}
                                />
                              </Box>
                            </>
                          )}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Stack>
            )}

            {/* Display Tab */}
            {currentTab === 3 && (
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showActiveIndicators}
                      onChange={(e) => updateSettings({ showActiveIndicators: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Show Active Indicators</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Highlight body parts when they trigger notes
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showMovementIntensity}
                      onChange={(e) => updateSettings({ showMovementIntensity: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Show Movement Intensity</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Display intensity meter for current movement
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showCurrentChord}
                      onChange={(e) => updateSettings({ showCurrentChord: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Show Current Chord</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Display the current chord being played
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={resetToDefault}
              size="small"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => setSaveDialogOpen(true)}
              size="small"
              sx={{ flex: 1 }}
            >
              Save Preset
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} variant="contained" disabled={!presetName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SettingsPanel
