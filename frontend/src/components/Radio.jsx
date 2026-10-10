export default function Radio({ onPlay, disabled, ready, seconds, volume, onVolumeChange, children, tunerContent, yearTuner, feedback, roundId }) {
  return (
    <section className="radio" aria-label="Radio playback controls">
      {(feedback === 'correct' || feedback === 'wrong') && (
        <div key={`${roundId}-${feedback}`} className={`radio-feedback radio-feedback-${feedback}`} aria-hidden="true">
          {feedback === 'correct' && Array.from({ length: 32 }, (_, index) => (
            <span className="radio-confetti" key={index} style={{
              '--origin': index % 2 ? '88%' : '12%',
              '--drift': `${(index % 2 ? -1 : 1) * (25 + (index * 37 % 230))}px`,
              '--rise': `${-(90 + (index * 29 % 230))}px`,
              '--spin': `${180 + index * 47}deg`,
              '--delay': `${index % 8 * 22}ms`,
              '--confetti-color': ['#c38a37', '#5c9e77', '#e78a69', '#e6c75f', '#88abb8', '#fff5d6'][index % 6],
            }} />
          ))}
        </div>
      )}
      <div className="radio-grille">
        <div className="radio-speaker" />
        <span className="radio-brand">Malayalam<span>MELODY CLUB</span></span>
        {yearTuner}
        {children}
      </div>
      <div className="radio-console">
        <div className="radio-control">
          <button className="radio-knob radio-play" onClick={onPlay} disabled={disabled} aria-label={`Play ${seconds} second clip`} title="Play clip">{ready ? '▶' : '…'}</button>
          <span>TUNE · PLAY</span>
        </div>
        {tunerContent ? <div key={feedback === 'wrong' ? `${roundId}-wrong` : 'display'} className={`radio-tuner radio-tuner-search${feedback === 'wrong' ? ' radio-answer-shake' : ''}`}>{tunerContent}</div> : <div className="radio-tuner">
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
