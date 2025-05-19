import { useState } from 'react'
import { 
  MusicMappingConfig, 
  BodyPartMapping, 
  AxisMapping,
  PRESET_CONFIGS,
  AVAILABLE_SCALES 
} from '../types/musicMapping'
import AxisVisualizer from './AxisVisualizer'
import './MusicMappingConfig.css'

interface MusicMappingConfigProps {
  selectedBodyParts: string[]
  currentConfig: MusicMappingConfig
  onConfigUpdate: (config: MusicMappingConfig) => void
}

function MusicMappingConfigComponent({ 
  selectedBodyParts, 
  currentConfig, 
  onConfigUpdate 
}: MusicMappingConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('intuitive')
  
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    const preset = PRESET_CONFIGS[presetName]
    if (preset) {
      // Filter mappings to only include selected body parts
      const filteredMappings: Record<string, BodyPartMapping> = {}
      selectedBodyParts.forEach(part => {
        if (preset.mappings[part]) {
          filteredMappings[part] = { ...preset.mappings[part] }
        } else {
          // Create default mapping for parts not in preset
          filteredMappings[part] = createDefaultMapping(part)
        }
      })
      
      onConfigUpdate({
        ...preset,
        mappings: filteredMappings
      })
    }
  }
  
  const createDefaultMapping = (bodyPart: string): BodyPartMapping => {
    return {
      bodyPart,
      enabled: true,
      instrument: 'piano',
      role: 'melody',
      xAxis: {
        parameter: 'none',
        range: [0, 1],
        invert: false
      },
      yAxis: {
        parameter: 'pitch',
        range: [0, 1],
        invert: true
      },
      velocityAxis: {
        parameter: 'volume',
        range: [0.1, 0.8],
        invert: false
      },
      scale: AVAILABLE_SCALES.pentatonic,
      octaveRange: [3, 5]
    }
  }
  
  const updateBodyPartMapping = (
    bodyPart: string, 
    field: keyof BodyPartMapping, 
    value: any
  ) => {
    const updatedMappings = { ...currentConfig.mappings }
    updatedMappings[bodyPart] = {
      ...updatedMappings[bodyPart],
      [field]: value
    }
    
    onConfigUpdate({
      ...currentConfig,
      mappings: updatedMappings
    })
  }
  
  const updateAxisMapping = (
    bodyPart: string,
    axis: 'xAxis' | 'yAxis' | 'velocityAxis',
    field: keyof AxisMapping,
    value: any
  ) => {
    const updatedMappings = { ...currentConfig.mappings }
    updatedMappings[bodyPart] = {
      ...updatedMappings[bodyPart],
      [axis]: {
        ...updatedMappings[bodyPart][axis],
        [field]: value
      }
    }
    
    onConfigUpdate({
      ...currentConfig,
      mappings: updatedMappings
    })
  }
  
  return (
    <div className="music-mapping-config">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Music Mapping Configuration</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="config-content">
          {/* Preset Selection */}
          <div className="preset-selection">
            <label>Preset:</label>
            <select value={selectedPreset} onChange={(e) => handlePresetChange(e.target.value)}>
              {Object.entries(PRESET_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name} - {config.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* Body Part Mappings */}
          <div className="body-part-mappings">
            {selectedBodyParts.map(bodyPart => {
              const mapping = currentConfig.mappings[bodyPart] || createDefaultMapping(bodyPart)
              
              return (
                <div key={bodyPart} className="body-part-config">
                  <h4>{bodyPart}</h4>
                  
                  <div className="config-row">
                    <label>Instrument:</label>
                    <select 
                      value={mapping.instrument}
                      onChange={(e) => updateBodyPartMapping(bodyPart, 'instrument', e.target.value)}
                    >
                      <option value="piano">Piano</option>
                      <option value="synth">Synth</option>
                      <option value="strings">Strings</option>
                      <option value="drums">Drums</option>
                      <option value="bass">Bass</option>
                      <option value="pad">Pad</option>
                    </select>
                  </div>
                  
                  <div className="config-row">
                    <label>Role:</label>
                    <select
                      value={mapping.role}
                      onChange={(e) => updateBodyPartMapping(bodyPart, 'role', e.target.value)}
                    >
                      <option value="melody">Melody</option>
                      <option value="harmony">Harmony</option>
                      <option value="rhythm">Rhythm</option>
                      <option value="bass">Bass</option>
                      <option value="effects">Effects</option>
                    </select>
                  </div>
                  
                  <div className="axis-config">
                    <h5>X-Axis (Horizontal Movement)</h5>
                    <div className="axis-row">
                      <label>Controls:</label>
                      <select
                        value={mapping.xAxis.parameter}
                        onChange={(e) => updateAxisMapping(bodyPart, 'xAxis', 'parameter', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="pitch">Pitch</option>
                        <option value="volume">Volume</option>
                        <option value="timbre">Timbre</option>
                        <option value="filter">Filter</option>
                        <option value="tempo">Tempo</option>
                      </select>
                    </div>
                    <div className="axis-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={mapping.xAxis.invert}
                          onChange={(e) => updateAxisMapping(bodyPart, 'xAxis', 'invert', e.target.checked)}
                        />
                        Invert
                      </label>
                    </div>
                  </div>
                  
                  <div className="axis-config">
                    <h5>Y-Axis (Vertical Movement)</h5>
                    <div className="axis-row">
                      <label>Controls:</label>
                      <select
                        value={mapping.yAxis.parameter}
                        onChange={(e) => updateAxisMapping(bodyPart, 'yAxis', 'parameter', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="pitch">Pitch</option>
                        <option value="volume">Volume</option>
                        <option value="timbre">Timbre</option>
                        <option value="filter">Filter</option>
                        <option value="tempo">Tempo</option>
                      </select>
                    </div>
                    <div className="axis-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={mapping.yAxis.invert}
                          onChange={(e) => updateAxisMapping(bodyPart, 'yAxis', 'invert', e.target.checked)}
                        />
                        Invert (up = higher)
                      </label>
                    </div>
                  </div>
                  
                  <div className="axis-config">
                    <h5>Movement Speed</h5>
                    <div className="axis-row">
                      <label>Controls:</label>
                      <select
                        value={mapping.velocityAxis.parameter}
                        onChange={(e) => updateAxisMapping(bodyPart, 'velocityAxis', 'parameter', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="volume">Volume</option>
                        <option value="pitch">Pitch</option>
                        <option value="timbre">Timbre</option>
                        <option value="filter">Filter</option>
                        <option value="tempo">Tempo</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Axis Visualizer */}
                  <AxisVisualizer
                    xLabel={mapping.xAxis.parameter}
                    yLabel={mapping.yAxis.parameter}
                    xInvert={mapping.xAxis.invert}
                    yInvert={mapping.yAxis.invert}
                  />
                  
                  <div className="config-row">
                    <label>Scale:</label>
                    <select
                      value={mapping.scale.join(',')}
                      onChange={(e) => {
                        const scaleName = e.target.value
                        const scale = AVAILABLE_SCALES[scaleName as keyof typeof AVAILABLE_SCALES]
                        updateBodyPartMapping(bodyPart, 'scale', scale)
                      }}
                    >
                      {Object.entries(AVAILABLE_SCALES).map(([name, notes]) => (
                        <option key={name} value={name}>
                          {name.charAt(0).toUpperCase() + name.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicMappingConfigComponent