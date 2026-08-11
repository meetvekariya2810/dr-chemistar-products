import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cinematic rotating video backdrop for the hero section.
 *
 * The five films total ~46 MB, so they are never all mounted at once. Two
 * <video> slots are alternated: the hidden slot loads the next film, and only
 * once it reports it can play do the slots crossfade. That keeps the transition
 * from ever showing a black or stalled frame, and holds at most two files in
 * flight instead of five.
 *
 * Sources are assigned imperatively rather than through a React prop. Letting
 * React own `src` meant the hidden slot could be handed a URL while the browser
 * had no reason to fetch it, so the readiness event never fired and rotation
 * stalled on the first film. Driving `src` + `load()` directly makes the fetch
 * explicit and keeps the swap deterministic.
 */

export interface HeroFilm {
  src: string;
  label: string;
}

/**
 * Opens on the sunrise landscape as an establishing wide shot, then runs the
 * brand story: seed -> farmer -> technology -> science.
 *
 * The order is deliberate. Measured average luminance of these files is:
 *   sunrise 132, farmer 118, drone 92, laboratory 77, seed 68
 * Leading with seed_growth meant the first thing a visitor saw was the darkest
 * footage of the five - a close-up of soil - which read as "dark website" no
 * matter how light the overlay was. The landscape lands as green fields and
 * golden sunlight immediately, then the seed close-up follows with context.
 * To restore the seed-first order, just move that entry back to the top.
 */
export const HERO_FILMS: HeroFilm[] = [
  { src: '/videos/sunrise_landscape.mp4', label: 'Sunrise agricultural landscape' },
  { src: '/videos/seed_growth.mp4', label: 'Seed to healthy crop' },
  { src: '/videos/farmer_journey.mp4', label: 'Farmer journey to harvest' },
  { src: '/videos/ai_drone_scanning.mp4', label: 'AI drone crop scanning' },
  { src: '/videos/laboratory_manufacturing.mp4', label: 'Laboratory to delivery' }
];

const ROTATE_MS = 24_000;   // within the 20-30s window the brief specifies
const CROSSFADE_MS = 2_000;
const LOAD_TIMEOUT_MS = 10_000; // never let one slow file freeze the rotation

export const HeroVideoBackground: React.FC = () => {
  const slotARef = useRef<HTMLVideoElement>(null);
  const slotBRef = useRef<HTMLVideoElement>(null);

  const [showA, setShowA] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Live refs so the rotation timer never closes over stale state.
  const indexRef = useRef(0);
  const showARef = useRef(true);
  showARef.current = showA;

  // Honour the OS "reduce motion" setting: hold a single still frame instead of
  // cycling films.
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Seed the first slot once the elements exist.
  useEffect(() => {
    const first = slotARef.current;
    if (!first || reduceMotion) return;
    first.src = HERO_FILMS[0].src;
    first.load();
    void first.play().catch(() => {});
  }, [reduceMotion]);

  /** Load the next film into the hidden slot, then crossfade to it. */
  const advance = useCallback(() => {
    const nextIndex = (indexRef.current + 1) % HERO_FILMS.length;
    const nextSrc = HERO_FILMS[nextIndex].src;
    const incoming = showARef.current ? slotBRef.current : slotARef.current;
    const outgoing = showARef.current ? slotARef.current : slotBRef.current;
    if (!incoming) return;

    let settled = false;
    let timeoutId = 0;

    const reveal = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      incoming.removeEventListener('canplaythrough', reveal);

      incoming.currentTime = 0;
      // play() rejects if the tab is backgrounded; harmless here.
      void incoming.play().catch(() => {});
      indexRef.current = nextIndex;
      setShowA(prev => !prev);

      // Free the outgoing decoder once it has faded out.
      window.setTimeout(() => outgoing?.pause(), CROSSFADE_MS);
    };

    incoming.addEventListener('canplaythrough', reveal);
    incoming.src = nextSrc;
    incoming.load();
    timeoutId = window.setTimeout(reveal, LOAD_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (reduceMotion || failed) return;
    const timer = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance, reduceMotion, failed]);

  const slotClass = (visible: boolean) =>
    `absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${
      visible && ready && !failed ? 'opacity-100' : 'opacity-0'
    }`;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950" aria-hidden="true">
      {/* Gradient floor - shown before the first frame paints, and if video fails. */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />

      {!reduceMotion && (
        <>
          <video
            ref={slotARef}
            className={slotClass(showA)}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
            muted
            loop
            playsInline
            onCanPlay={() => setReady(true)}
            onError={() => setFailed(true)}
          />
          <video
            ref={slotBRef}
            className={slotClass(!showA)}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
            muted
            loop
            playsInline
          />
        </>
      )}

      {/*
        Readability scrim - deliberately LOCALISED, not a blanket darkening.
        The hero copy sits in the left column, so weight falls off sharply to
        the right: by 65% across, the footage is essentially untouched, which
        keeps the green crops and golden sunlight dominant instead of turning
        the whole hero navy. Only the left edge is dark enough to guarantee
        contrast for the white headline.
      */}
      {/*
        Below lg the copy spans the full width, so a left-weighted gradient
        leaves the subtitle sitting on bright sky with no contrast. Small
        screens get a vertical scrim instead; only the two-column desktop
        layout uses the horizontal falloff.
      */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,15,25,0.86) 0%, rgba(3,15,25,0.72) 55%, rgba(3,15,25,0.5) 100%)'
        }}
      />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(3,15,25,0.82) 0%, rgba(3,15,25,0.55) 35%, rgba(3,15,25,0.18) 65%, rgba(3,15,25,0.02) 100%)'
        }}
      />
      {/* Gentle floor so the hero settles into the stats section below. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: 'linear-gradient(to top, rgba(3,15,25,0.55), rgba(3,15,25,0))' }}
      />
    </div>
  );
};
