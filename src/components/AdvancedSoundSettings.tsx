import { useState, useEffect } from 'react';
import './AdvancedSoundSettings.css';

interface AdvancedSoundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings: (settings: AdvancedSoundSettings) => void;
  selectedBodyParts: string[];
  currentSettings: AdvancedSoundSettings;
}

// Global settings that apply to all body parts
export interface GlobalSoundSettings {
  masterVolume: number;
  reverb: number;
  scale: string;
  tempo: number;
}

// Settings for an individual body part
export interface BodyPartSoundMapping {
  instrument: string;
  noteDuration: string;
  xAxisMapping: string;
  yAxisMapping: string;
  effect: string;
  effectIntensity: number;
}

// Complete sound settings object
export interface AdvancedSoundSettings {
  global: GlobalSoundSettings;
  bodyPartMappings: Record<string, BodyPartSoundMapping>;
}

// Available instruments
const INSTRUMENTS = [
  { id: 'piano', label: 'Piano' },
  { id: 'synth', label: 'Synthesizer' },
  { id: 'marimba', label: 'Marimba' },
  { id: 'bass', label: 'Bass' },
  { id: 'strings', label: 'Strings' },
  { id: 'drums', label: 'Percussion' }
];

// Available scales
const SCALES = [
  { id: 'pentatonic', label: 'Pentatonic (5 notes)' },
  { id: 'major', label: 'Major (7 notes)' },
  { id: 'minor', label: 'Minor (7 notes)' },
  { id: 'blues', label: 'Blues Scale' },
  { id: 'chromatic', label: 'Chromatic (12 notes)' }
];

// Available note durations
const NOTE_DURATIONS = [
  { id: '16n', label: 'Very Short (16th note)' },
  { id: '8n', label: 'Short (8th note)' },
  { id: '4n', label: 'Medium (Quarter note)' },
  { id: '2n', label: 'Long (Half note)' }
];

// Axis mapping options
const AXIS_MAPPINGS = [
  { id: 'pitch', label: 'Pitch' },
  { id: 'volume', label: 'Volume' },
  { id: 'duration', label: 'Note Duration' },
  { id: 'effect', label: 'Effect Intensity' },
  { id: 'timbre', label: 'Timbre/Tone' }
];

// Available effects
const EFFECTS = [
  { id: 'none', label: 'None' },
  { id: 'vibrato', label: 'Vibrato' },
  { id: 'tremolo', label: 'Tremolo' },
  { id: 'distortion', label: 'Distortion' },
  { id: 'reverb', label: 'Reverb' },
  { id: 'delay', label: 'Delay/Echo' }
];

// Common presets for body parts
const PRESETS = {
  'melody': {
    instrument: 'piano',
    noteDuration: '8n',
    xAxisMapping: 'duration',
    yAxisMapping: 'pitch',
    effect: 'none',
    effectIntensity: 0.2
  },
  'bass': {
    instrument: 'bass',
    noteDuration: '4n',
    xAxisMapping: 'timbre',
    yAxisMapping: 'pitch',
    effect: 'none',
    effectIntensity: 0.0
  },
  'percussion': {
    instrument: 'drums',
    noteDuration: '16n',
    xAxisMapping: 'volume',
    yAxisMapping: 'timbre',
    effect: 'none',
    effectIntensity: 0.0
  },
  'ambient': {
    instrument: 'strings',
    noteDuration: '2n',
    xAxisMapping: 'effect',
    yAxisMapping: 'pitch',
    effect: 'reverb',
    effectIntensity: 0.7
  }
};

function AdvancedSoundSettings({ 
  isOpen, 
  onClose, 
  onApplySettings, 
  selectedBodyParts,
  currentSettings 
}: AdvancedSoundSettingsProps) {
  const [settings, setSettings] = useState<AdvancedSoundSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<string>('global');
  
  // Initialize any new body parts with default settings
  useEffect(() => {
    const updatedSettings = { ...settings };
    let hasChanges = false;
    
    selectedBodyParts.forEach(part => {
      if (!updatedSettings.bodyPartMappings[part]) {
        updatedSettings.bodyPartMappings[part] = {
          instrument: 'piano',
          noteDuration: '8n',
          xAxisMapping: 'duration',
          yAxisMapping: 'pitch',
          effect: 'none',
          effectIntensity: 0.0
        };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setSettings(updatedSettings);
    }
  }, [selectedBodyParts, settings]);
  
  // Handle global setting changes
  const handleGlobalChange = (name: keyof GlobalSoundSettings, value: any) => {
    setSettings({
      ...settings,
      global: {
        ...settings.global,
        [name]: value
      }
    });
  };
  
  // Handle body part setting changes
  const handleBodyPartChange = (
    partId: string, 
    property: keyof BodyPartSoundMapping, 
    value: any
  ) => {
    setSettings({
      ...settings,
      bodyPartMappings: {
        ...settings.bodyPartMappings,
        [partId]: {
          ...settings.bodyPartMappings[partId],
          [property]: value
        }
      }
    });
  };
  
  // Apply a preset to a body part
  const applyPreset = (partId: string, presetId: keyof typeof PRESETS) => {
    setSettings({
      ...settings,
      bodyPartMappings: {
        ...settings.bodyPartMappings,
        [partId]: { ...PRESETS[presetId] }
      }
    });
  };
  
  // Apply the same setting to all body parts
  const applyToAll = (property: keyof BodyPartSoundMapping, value: any) => {
    const updatedMappings = { ...settings.bodyPartMappings };
    
    selectedBodyParts.forEach(part => {
      if (updatedMappings[part]) {
        updatedMappings[part] = {
          ...updatedMappings[part],
          [property]: value
        };
      }
    });
    
    setSettings({
      ...settings,
      bodyPartMappings: updatedMappings
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySettings(settings);
  };
  
  // Generate a human-readable name for a body part
  const getBodyPartName = (partId: string): string => {
    return partId
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="advanced-settings-overlay">
      <div className="advanced-settings-container">
        <header className="settings-header">
          <h2>Advanced Sound Settings</h2>
          <div className="tabs">
            <button 
              onClick={() => setActiveTab('global')}
              className={activeTab === 'global' ? 'active' : ''}
            >
              Global
            </button>
            {selectedBodyParts.map(part => (
              <button 
                key={part}
                onClick={() => setActiveTab(part)}
                className={activeTab === part ? 'active' : ''}
              >
                {getBodyPartName(part)}
              </button>
            ))}
          </div>
        </header>
        
        <form onSubmit={handleSubmit}>
          {/* Global Settings Tab */}
          {activeTab === 'global' && (
            <div className="global-settings">
              <h3>Global Sound Settings</h3>
              
              <div className="settings-group">
                <label htmlFor="scale">Musical Scale</label>
                <select 
                  id="scale" 
                  value={settings.global.scale}
                  onChange={(e) => handleGlobalChange('scale', e.target.value)}
                >
                  {SCALES.map(scale => (
                    <option key={scale.id} value={scale.id}>{scale.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="settings-group">
                <label htmlFor="masterVolume">
                  Master Volume: {Math.round(settings.global.masterVolume * 100)}%
                </label>
                <input 
                  type="range" 
                  id="masterVolume" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={settings.global.masterVolume}
                  onChange={(e) => handleGlobalChange('masterVolume', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="settings-group">
                <label htmlFor="reverb">
                  Room Reverb: {Math.round(settings.global.reverb * 100)}%
                </label>
                <input 
                  type="range" 
                  id="reverb" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={settings.global.reverb}
                  onChange={(e) => handleGlobalChange('reverb', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="settings-group">
                <label htmlFor="tempo">
                  Base Tempo: {settings.global.tempo} BPM
                </label>
                <input 
                  type="range" 
                  id="tempo" 
                  min="60" 
                  max="180" 
                  step="5"
                  value={settings.global.tempo}
                  onChange={(e) => handleGlobalChange('tempo', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
          
          {/* Body Part Specific Settings */}
          {activeTab !== 'global' && settings.bodyPartMappings[activeTab] && (
            <div className="body-part-settings">
              <h3>{getBodyPartName(activeTab)} Settings</h3>
              
              <div className="preset-buttons">
                <label>Quick Presets:</label>
                <div className="preset-options">
                  <button 
                    type="button" 
                    onClick={() => applyPreset(activeTab, 'melody')}
                    className="preset-button"
                  >
                    Melody
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset(activeTab, 'bass')}
                    className="preset-button"
                  >
                    Bass
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset(activeTab, 'percussion')}
                    className="preset-button"
                  >
                    Percussion
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset(activeTab, 'ambient')}
                    className="preset-button"
                  >
                    Ambient
                  </button>
                </div>
              </div>
              
              <div className="settings-group">
                <label htmlFor={`${activeTab}-instrument`}>Instrument</label>
                <select 
                  id={`${activeTab}-instrument`}
                  value={settings.bodyPartMappings[activeTab].instrument}
                  onChange={(e) => handleBodyPartChange(activeTab, 'instrument', e.target.value)}
                >
                  {INSTRUMENTS.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.label}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="apply-to-all"
                  onClick={() => applyToAll('instrument', settings.bodyPartMappings[activeTab].instrument)}
                >
                  Apply to All Parts
                </button>
              </div>
              
              <div className="settings-group">
                <label htmlFor={`${activeTab}-noteDuration`}>Note Duration</label>
                <select 
                  id={`${activeTab}-noteDuration`}
                  value={settings.bodyPartMappings[activeTab].noteDuration}
                  onChange={(e) => handleBodyPartChange(activeTab, 'noteDuration', e.target.value)}
                >
                  {NOTE_DURATIONS.map(duration => (
                    <option key={duration.id} value={duration.id}>{duration.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="axis-mappings">
                <div className="settings-group">
                  <label htmlFor={`${activeTab}-xAxis`}>Horizontal Movement Controls</label>
                  <select 
                    id={`${activeTab}-xAxis`}
                    value={settings.bodyPartMappings[activeTab].xAxisMapping}
                    onChange={(e) => handleBodyPartChange(activeTab, 'xAxisMapping', e.target.value)}
                  >
                    {AXIS_MAPPINGS.map(mapping => (
                      <option key={mapping.id} value={mapping.id}>{mapping.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="settings-group">
                  <label htmlFor={`${activeTab}-yAxis`}>Vertical Movement Controls</label>
                  <select 
                    id={`${activeTab}-yAxis`}
                    value={settings.bodyPartMappings[activeTab].yAxisMapping}
                    onChange={(e) => handleBodyPartChange(activeTab, 'yAxisMapping', e.target.value)}
                  >
                    {AXIS_MAPPINGS.map(mapping => (
                      <option key={mapping.id} value={mapping.id}>{mapping.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="settings-group">
                <label htmlFor={`${activeTab}-effect`}>Sound Effect</label>
                <select 
                  id={`${activeTab}-effect`}
                  value={settings.bodyPartMappings[activeTab].effect}
                  onChange={(e) => handleBodyPartChange(activeTab, 'effect', e.target.value)}
                >
                  {EFFECTS.map(effect => (
                    <option key={effect.id} value={effect.id}>{effect.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="settings-group">
                <label htmlFor={`${activeTab}-effectIntensity`}>
                  Effect Intensity: {Math.round(settings.bodyPartMappings[activeTab].effectIntensity * 100)}%
                </label>
                <input 
                  type="range" 
                  id={`${activeTab}-effectIntensity`}
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={settings.bodyPartMappings[activeTab].effectIntensity}
                  onChange={(e) => handleBodyPartChange(
                    activeTab, 
                    'effectIntensity', 
                    parseFloat(e.target.value)
                  )}
                />
              </div>
            </div>
          )}
          
          <div className="buttons-container">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="apply-button">
              Apply Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdvancedSoundSettings;