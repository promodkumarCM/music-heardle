import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

let apiReadyPromise = null
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiReadyPromise) return apiReadyPromise
  apiReadyPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiReadyPromise
}

const MAX_ATTEMPTS = 2
const WATCHDOG_MS = 3500

// Hidden YouTube player: audio-only UX, no video shown, no YouTube chrome visible.
const Player = forwardRef(function Player({ onReady, onUnplayable, onPlaybackStatus }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const stopTimerRef = useRef(null)
  const watchdogTimerRef = useRef(null)
  const pendingDurationRef = useRef(null)
  const pendingVideoIdRef = useRef(null)
  const pendingStartRef = useRef(0)
  const lastRequestRef = useRef({ videoId: null, at: 0 })
  const attemptRef = useRef({ videoId: null, count: 0 })
  const armWatchdogRef = useRef(null)
  const playbackStatusRef = useRef(onPlaybackStatus)
  playbackStatusRef.current = onPlaybackStatus
  const onReadyRef = useRef(onReady)
  const onUnplayableRef = useRef(onUnplayable)
  onReadyRef.current = onReady
  onUnplayableRef.current = onUnplayable

  useEffect(() => {
    let cancelled = false
    // YT.Player replaces its target element with an iframe. Give it a plain
    // node we create ourselves, not the div React renders/owns via ref —
    // otherwise React's unmount later tries to remove a node YT already
    // swapped out from under it and crashes with a removeChild error.
    const target = document.createElement('div')
    containerRef.current.appendChild(target)

    // Re-arms itself on every retry, so a video that keeps silently failing
    // (no onError, never reaches PLAYING) gets caught on attempt 2 as well,
    // not just attempt 1. Stops once MAX_ATTEMPTS is hit, or once the video
    // starts playing (onStateChange clears watchdogTimerRef then). Shared by
    // both the "never got any event at all" path and the onError path.
    function armWatchdog(videoId, startSeconds) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = setTimeout(() => {
        if (pendingVideoIdRef.current !== videoId || attemptRef.current.videoId !== videoId) return
        if (attemptRef.current.count >= MAX_ATTEMPTS) {
          onUnplayableRef.current?.(videoId)
          return
        }
        attemptRef.current.count += 1
        playerRef.current?.loadVideoById?.({ videoId, startSeconds })
        armWatchdog(videoId, startSeconds)
      }, WATCHDOG_MS)
    }
    armWatchdogRef.current = armWatchdog

    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(target, {
        height: '0',
        width: '0',
        events: {
          // player methods (loadVideoById etc) don't exist until this fires
          onReady: () => onReadyRef.current?.(),
          onAutoplayBlocked: () => {
            clearTimeout(watchdogTimerRef.current)
            playbackStatusRef.current?.('Playback was blocked. Press Tune again to retry.')
          },
          onStateChange: (e) => {
            // Only start the "stop after N seconds" clock once playback has
            // actually begun — starting it at loadVideoById() time meant a
            // short snippet (e.g. Impossible's 1s) could get paused by our
            // own timer while the video was still buffering, before the
            // listener heard anything.
            //
            // A PLAYING event doesn't say which video it's for, and a
            // trailing event from the PREVIOUS song can arrive right as the
            // next one starts loading — which would wrongly arm (and almost
            // immediately fire) the stop timer for the new song. Guard by
            // checking the player's actual currently-loaded video id.
            if (e.data !== window.YT.PlayerState.PLAYING || pendingDurationRef.current == null) return
            const currentId = playerRef.current?.getVideoData?.()?.video_id
            if (currentId !== pendingVideoIdRef.current) return

            playbackStatusRef.current?.('Playing…')
            clearTimeout(watchdogTimerRef.current)
            const duration = pendingDurationRef.current
            pendingDurationRef.current = null
            clearTimeout(stopTimerRef.current)
            stopTimerRef.current = setTimeout(() => {
              playerRef.current?.pauseVideo?.()
              playbackStatusRef.current?.('Clip finished. Press Tune to replay.')
            }, duration * 1000)
          },
          onError: () => {
            // A load failure (network blip, momentary API hiccup, or a
            // genuinely blocked video) would otherwise leave the player
            // silently stuck. Funnel through the same retry loop used for a
            // silent (non-erroring) failure, rather than two separate ones.
            const videoId = pendingVideoIdRef.current
            if (!videoId || attemptRef.current.videoId !== videoId) return
            armWatchdog(videoId, pendingStartRef.current)
          },
        },
      })
    })
    return () => {
      cancelled = true
      clearTimeout(stopTimerRef.current)
      clearTimeout(watchdogTimerRef.current)
      playerRef.current?.destroy?.()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    prepare(videoId) {
      const player = playerRef.current
      if (!player?.cueVideoById || player.getVideoData?.()?.video_id === videoId) return
      // Cue metadata without autoplay. YouTube decides when media is buffered.
      player.cueVideoById({ videoId, startSeconds: 0 })
    },
    playSnippet(videoId, startSeconds, durationSeconds, volume = 70) {
      const player = playerRef.current
      if (!player || !player.loadVideoById) return
      // Calling loadVideoById() again for the same video while the previous
      // call is still loading interrupts it — repeated fast clicks (e.g. a
      // user re-clicking Play because a 1s "Impossible" clip was easy to
      // miss) can leave the player stuck never reaching PLAYING at all.
      // Ignore an accidental rapid re-click of the exact same clip.
      const now = Date.now()
      const last = lastRequestRef.current
      if (last.videoId === videoId && now - last.at < 500) return
      lastRequestRef.current = { videoId, at: now }
      attemptRef.current = { videoId, count: 1 }

      clearTimeout(stopTimerRef.current)
      clearTimeout(watchdogTimerRef.current)
      pendingDurationRef.current = durationSeconds
      pendingVideoIdRef.current = videoId
      pendingStartRef.current = startSeconds
      playbackStatusRef.current?.('Loading clip…')
      player.unMute?.()
      player.setVolume(volume)
      if (player.getVideoData?.()?.video_id === videoId) {
        player.seekTo(startSeconds, true)
        player.playVideo()
      } else {
        player.loadVideoById({ videoId, startSeconds })
      }
      armWatchdogRef.current?.(videoId, startSeconds)
    },
    setVolume(value) {
      playerRef.current?.setVolume?.(value)
    },
    stop() {
      pendingDurationRef.current = null
      pendingVideoIdRef.current = null
      clearTimeout(stopTimerRef.current)
      clearTimeout(watchdogTimerRef.current)
      playerRef.current?.pauseVideo?.()
    },
  }))

  return <div ref={containerRef} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
})

export default Player
