export default function YearTuner({ years, value, onChange }) {
  const station = years.indexOf(value)
  const description = value ? `After ${value}` : 'All years'
  const changeStation = (event) => onChange(years[Number(event.target.value)])

  return (
    <div className="radio-year-tuner">
      <div className="year-dial-glass">
        <div className="year-dial-heading"><span>FM · YEAR</span><strong>{description}</strong></div>
        <div className="year-dial-scale">
          <div className="radio-year-stations">
            {years.map(year => <button key={year} type="button" aria-pressed={value === year} onClick={() => onChange(year)}>{year || 'ALL'}</button>)}
          </div>
          <div className="year-dial-ticks" aria-hidden="true" />
          <input className="year-dial-slider" type="range" min="0" max={years.length - 1} step="1" value={station} aria-label="Year tuner" aria-valuetext={description} onChange={changeStation} />
          <div className="year-dial-ticks year-dial-ticks-small" aria-hidden="true" />
        </div>
        <span className="year-dial-caption">MALAYALAM · MELODY BAND</span>
      </div>
      <label className="year-knob-control">
        <span>TUNING</span>
        <div className="year-brass-knob" style={{ '--knob-angle': `${-135 + station / (years.length - 1) * 270}deg` }}>
          <i aria-hidden="true" />
          <input type="range" min="0" max={years.length - 1} step="1" value={station} aria-label="Year tuning knob" aria-valuetext={description} onChange={changeStation} title="Drag left or right, or use arrow keys to tune" />
        </div>
        <span className="year-knob-help">DRAG TO TUNE</span>
      </label>
    </div>
  )
}
