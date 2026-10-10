import { useEffect, useRef, useState } from 'react'

export function useRoundFeedback() {
  const [feedback, setFeedback] = useState(null)
  const targetRef = useRef(null)
  useEffect(() => {
    if (feedback?.type !== 'wrong' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = targetRef.current?.animate(
      [0, -3, 3, -3, 3, 0].map(x => ({ transform: `translateX(${x}px)` })),
      { duration: 380, easing: 'ease-out' },
    )
    return () => animation?.cancel()
  }, [feedback])
  return { feedback, targetRef, showFeedback: type => setFeedback(previous => ({ type, id: (previous?.id || 0) + 1 })), clearFeedback: () => setFeedback(null) }
}

export default function RoundFeedback({ feedback }) {
  if (!feedback) return null
  return <div key={feedback.id} className={`radio-feedback radio-feedback-${feedback.type}`} aria-hidden="true">
    {feedback.type === 'correct' && Array.from({ length: 32 }, (_, index) => <span className="radio-confetti" key={index} style={{
      '--origin': index % 2 ? '88%' : '12%',
      '--drift': `${(index % 2 ? -1 : 1) * (25 + index * 37 % 230)}px`,
      '--rise': `${-(90 + index * 29 % 230)}px`,
      '--spin': `${180 + index * 47}deg`,
      '--delay': `${index % 8 * 22}ms`,
      '--confetti-color': ['#c38a37', '#5c9e77', '#e78a69', '#e6c75f', '#88abb8', '#fff5d6'][index % 6],
    }} />)}
  </div>
}
