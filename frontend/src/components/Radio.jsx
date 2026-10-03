export default function Radio({ onPlay, disabled, ready, seconds, volume, onVolumeChange, children, tunerContent }) {
  return (
    <section className="radio" aria-label="Radio playback controls">
      <div className="radio-grille">
        <div className="radio-speaker" />
        <span className="radio-brand">Malayalam<span>MELODY CLUB</span></span>
        {children}
      </div>
      <div className="radio-console">
        <div className="radio-control">
          <button className="radio-knob radio-play" onClick={onPlay} disabled={disabled} aria-label={`Play ${seconds} second clip`} title="Play clip">{ready ? '▶' : '…'}</button>
          <span>TUNE · PLAY</span>
        </div>
        {tunerContent ? <div className="radio-tuner radio-tuner-search">{tunerContent}</div> : <div className="radio-tuner">
          <div className="radio-frequencies"><span>88</span><span>94</span><span>102</span><span>108</span></div>
          <div className="radio-scale" /><i />
          <span className="radio-fm">{seconds} SEC · CLIP</span>
        </div>}
        <label className="radio-control radio-volume">
          <div className="radio-knob" aria-hidden="true" style={{ transform: `rotate(${volume * 2.7 - 135}deg)` }}><b /></div>
          <input type="range" min="0" max="100" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} aria-label="Volume" />
          <span>VOL · {volume}%</span>
        </label>
      </div>
    </section>
  )
}
