// Decorative landscape for the split auth layout. Every colour comes from CSS
// classes in dashboard.css, so the scene follows the light/dark theme: a dawn
// sky in light mode, a night sky in dark mode.
function AuthArt() {
  return (
    <div className="auth-art" aria-hidden="true">
      <svg
        className="auth-art__scene"
        viewBox="0 0 400 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="auth-art-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="auth-art__sky-top" />
            <stop offset="0.55" className="auth-art__sky-mid" />
            <stop offset="1" className="auth-art__sky-low" />
          </linearGradient>
          <radialGradient id="auth-art-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className="auth-art__glow-in" />
            <stop offset="1" className="auth-art__glow-out" />
          </radialGradient>
        </defs>

        <rect width="400" height="560" fill="url(#auth-art-sky)" />
        <circle cx="290" cy="150" r="120" fill="url(#auth-art-glow)" />
        <circle className="auth-art__moon" cx="290" cy="150" r="22" />

        <g className="auth-art__stars">
          <circle cx="48" cy="60" r="1.4" />
          <circle cx="120" cy="34" r="1" />
          <circle cx="182" cy="92" r="1.2" />
          <circle cx="236" cy="48" r="0.9" />
          <circle cx="352" cy="70" r="1.3" />
          <circle cx="80" cy="140" r="0.9" />
          <circle cx="150" cy="180" r="1.1" />
          <circle cx="372" cy="210" r="0.9" />
          <circle cx="30" cy="230" r="1" />
        </g>

        <path
          className="auth-art__ridge-1"
          d="M0 300 L60 250 L110 280 L170 200 L230 260 L280 230 L340 270 L400 220 L400 560 L0 560 Z"
        />
        <path
          className="auth-art__ridge-2"
          d="M0 350 L50 320 L100 340 L150 290 L210 345 L260 315 L320 350 L370 320 L400 335 L400 560 L0 560 Z"
        />
        <path
          className="auth-art__ridge-3"
          d="M0 410 C70 380 120 395 180 375 C250 352 320 400 400 380 L400 560 L0 560 Z"
        />
        <path
          className="auth-art__ridge-4"
          d="M0 470 C90 440 160 470 240 445 C310 425 360 450 400 440 L400 560 L0 560 Z"
        />

        {/* A faint activity trace across the hills — a nod to what the app does. */}
        <polyline
          className="auth-art__pulse"
          points="0,430 90,430 110,430 125,400 140,460 155,415 170,430 400,430"
        />
      </svg>

      <div className="auth-art__caption">
        <span className="auth-art__brand">DevPulse</span>
        <p className="auth-art__tagline">
          One dashboard for your coding activity.
        </p>
      </div>
    </div>
  )
}

export default AuthArt
