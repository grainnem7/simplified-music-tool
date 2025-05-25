import { useTheme } from '../contexts/ThemeContext'
import './ThemeSelector.css'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-selector">
      <label htmlFor="theme-select">Theme:</label>
      <select 
        id="theme-select"
        value={theme} 
        onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'highContrast')}
        aria-label="Select theme"
      >
        <option value="dark">Dark Mode</option>
        <option value="light">Light Mode</option>
        <option value="highContrast">High Contrast</option>
      </select>
    </div>
  )
}

export default ThemeSelector