import { useState } from 'react';
import './SoundSettings.css';

interface SoundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings: (settings: SoundSettings) => void;
  currentSettings: SoundSettings;
}

export interface SoundSettings {
  scale: string;
  instrument: string;
  noteDuration: string;
  volume: number;
  reverb: number;
  attack: number;
  release: number;
}

function SoundSettings({ isOpen, onClose, onApplySettings, currentSettings }: SoundSettingsProps) {
  const [settings, setSettings] = useState<SoundSettings>(currentSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert range inputs to numbers
    if (type === 'range') {
      setSettings({
        ...settings,
        [name]: parseFloat(value)
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplySettings(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="sound-settings-overlay">
      <div className="sound-settings-container">
        <h2>Sound Settings</h2>
        <form onSubmit={handleSubmit}>
          <div className="settings-group">
            <label htmlFor="scale">Musical Scale</label>
            <select 
              id="scale" 
              name="scale" 
              value={settings.scale}
              onChange={handleChange}
            >
              <option value="pentatonic">Pentatonic (5 notes)</option>
              <option value="major">Major (7 notes)</option>
              <option value="minor">Minor (7 notes)</option>
              <option value="blues">Blues Scale</option>
            </select>
          </div>

          <div className="settings-group">
            <label htmlFor="instrument">Instrument</label>
            <select 
              id="instrument" 
              name="instrument" 
              value={settings.instrument}
              onChange={handleChange}
            >
              <option value="piano">Piano</option>
              <option value="synth">Synthesizer</option>
              <option value="marimba">Marimba</option>
              <option value="bass">Bass</option>
            </select>
          </div>

          <div className="settings-group">
            <label htmlFor="noteDuration">Note Length</label>
            <select 
              id="noteDuration" 
              name="noteDuration" 
              value={settings.noteDuration}
              onChange={handleChange}
            >
              <option value="16n">Very Short (16th note)</option>
              <option value="8n">Short (8th note)</option>
              <option value="4n">Medium (Quarter note)</option>
              <option value="2n">Long (Half note)</option>
            </select>
          </div>

          <div className="settings-group">
            <label htmlFor="volume">
              Volume: {Math.round(settings.volume * 100)}%
            </label>
            <input 
              type="range" 
              id="volume" 
              name="volume" 
              min="0" 
              max="1" 
              step="0.05"
              value={settings.volume}
              onChange={handleChange}
            />
          </div>

          <div className="settings-group">
            <label htmlFor="reverb">
              Reverb: {Math.round(settings.reverb * 100)}%
            </label>
            <input 
              type="range" 
              id="reverb" 
              name="reverb" 
              min="0" 
              max="1" 
              step="0.05"
              value={settings.reverb}
              onChange={handleChange}
            />
          </div>

          <div className="settings-group">
            <label htmlFor="attack">
              Attack: {settings.attack.toFixed(2)}s
            </label>
            <input 
              type="range" 
              id="attack" 
              name="attack" 
              min="0.01" 
              max="1" 
              step="0.01"
              value={settings.attack}
              onChange={handleChange}
            />
          </div>

          <div className="settings-group">
            <label htmlFor="release">
              Release: {settings.release.toFixed(2)}s
            </label>
            <input 
              type="range" 
              id="release" 
              name="release" 
              min="0.1" 
              max="3" 
              step="0.1"
              value={settings.release}
              onChange={handleChange}
            />
          </div>

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

export default SoundSettings;