import type { Resort } from '../types';

interface SceneProps {
  resort: Resort;
  className?: string;
}

/**
 * Procedural SVG "photography" — deterministic per resort (hue + scene variant).
 * Replaces stock photos so the app ships without external image dependencies.
 */
export default function Scene({ resort, className = '' }: SceneProps) {
  const h = resort.hue;
  const sky = `hsl(${h} 45% 82%)`;
  const skyDeep = `hsl(${h + 8} 55% 68%)`;
  const seaFar = `hsl(${h + 6} 60% 55%)`;
  const seaNear = `hsl(${h} 55% 42%)`;
  const sandC = `hsl(40 42% 88%)`;
  const villaWall = `hsl(${h - 10} 22% 94%)`;
  const roof = `hsl(${h - 14} 30% 72%)`;
  const palm = `hsl(${h + 40} 35% 32%)`;
  const id = resort.id;

  if (resort.scene === 'aerial') {
    return (
      <svg viewBox="0 0 640 400" className={className} role="img" aria-label={`Aerial view of ${resort.name}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky} />
            <stop offset="1" stopColor={skyDeep} />
          </linearGradient>
          <radialGradient id={`shoal-${id}`} cx="0.5" cy="0.55" r="0.5">
            <stop offset="0" stopColor={`hsl(${h} 70% 70%)`} />
            <stop offset="1" stopColor={`hsl(${h} 65% 55%)`} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="220" fill={`url(#sky-${id})`} />
        <rect y="140" width="640" height="260" fill={seaFar} />
        <ellipse cx="320" cy="270" rx="290" ry="110" fill={`url(#shoal-${id})`} />
        <ellipse cx="330" cy="275" rx="200" ry="72" fill={sandC} opacity="0.9" />
        <ellipse cx="330" cy="272" rx="160" ry="56" fill={`hsl(${h + 50} 35% 45%)`} opacity="0.85" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${190 + i * 80} ${230 + (i % 2) * 34})`}>
            <rect x="-16" y="-14" width="32" height="26" rx="3" fill={villaWall} />
            <rect x="-19" y="-19" width="38" height="8" rx="3" fill={roof} />
            <rect x="14" y="-4" width="42" height="7" rx="3" fill={roof} opacity="0.9" />
            <rect x="54" y="-3" width="8" height="6" rx="2" fill={villaWall} />
          </g>
        ))}
        {[60, 130, 520, 585].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i < 2 ? 245 : 300})`}>
            <rect x="-3" y="-34" width="6" height="36" fill={palm} />
            <path d="M0,-36 C-24,-48 -34,-34 -40,-24 C-24,-32 -10,-34 0,-36 Z" fill={palm} />
            <path d="M0,-36 C24,-48 34,-34 40,-24 C24,-32 10,-34 0,-36 Z" fill={palm} />
            <path d="M0,-38 C-8,-56 6,-58 14,-50 C4,-48 0,-44 0,-38 Z" fill={palm} opacity="0.9" />
          </g>
        ))}
        <path d="M0 360 Q160 344 320 356 T640 348 L640 400 L0 400 Z" fill={seaNear} opacity="0.6" />
      </svg>
    );
  }

  if (resort.scene === 'overwater') {
    return (
      <svg viewBox="0 0 640 400" className={className} role="img" aria-label={`Water villas at ${resort.name}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`oh-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyDeep} />
            <stop offset="1" stopColor={sky} />
          </linearGradient>
          <linearGradient id={`os-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`hsl(${h} 65% 60%)`} />
            <stop offset="1" stopColor={seaNear} />
          </linearGradient>
        </defs>
        <rect width="640" height="210" fill={`url(#oh-${id})`} />
        <circle cx="520" cy="70" r="34" fill="#fff7d9" opacity="0.9" />
        <rect y="205" width="640" height="195" fill={`url(#os-${id})`} />
        <g opacity="0.35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
          <path d="M40 250 h60 M140 262 h44 M240 246 h70 M420 258 h56 M520 244 h64" />
          <path d="M80 300 h52 M300 312 h64 M470 302 h48" />
        </g>
        {[140, 340, 530].map((x, i) => (
          <g key={x} transform={`translate(${x} ${250 + (i % 2) * 16})`}>
            <rect x="-46" y="-64" width="96" height="58" rx="6" fill={villaWall} />
            <path d="M-56,-64 L54,-64 L40,-88 L-42,-88 Z" fill={roof} />
            <rect x="-24" y="-46" width="34" height="26" rx="3" fill={`hsl(${h} 40% 60%)`} opacity="0.75" />
            {i === 1 && <rect x="-58" y="-30" width="120" height="8" rx="4" fill={roof} opacity="0.9" />}
            {[-30, -14, 14, 30].map((dx) => (
              <rect key={dx} x={dx} y="-6" width="6" height="34" fill={roof} opacity="0.8" />
            ))}
          </g>
        ))}
        <path d="M0 190 Q160 176 320 186 T640 180 L640 214 L0 214 Z" fill={sandC} opacity="0.85" />
        {[70, 600].map((x) => (
          <g key={x} transform={`translate(${x} 200)`}>
            <rect x="-4" y="-46" width="8" height="50" fill={palm} />
            <path d="M0,-48 C-30,-62 -42,-44 -50,-32 C-30,-42 -12,-46 0,-48 Z" fill={palm} />
            <path d="M0,-48 C30,-62 42,-44 50,-32 C30,-42 12,-46 0,-48 Z" fill={palm} />
          </g>
        ))}
      </svg>
    );
  }

  if (resort.scene === 'sunset') {
    return (
      <svg viewBox="0 0 640 400" className={className} role="img" aria-label={`Sunset at ${resort.name}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`ss-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`hsl(${h} 70% 62%)`} />
            <stop offset="0.55" stopColor={`hsl(${h + 25} 80% 72%)`} />
            <stop offset="1" stopColor={`hsl(${h + 40} 75% 80%)`} />
          </linearGradient>
          <linearGradient id={`sw-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`hsl(${h} 65% 58%)`} />
            <stop offset="1" stopColor={`hsl(${h - 10} 55% 32%)`} />
          </linearGradient>
        </defs>
        <rect width="640" height="240" fill={`url(#ss-${id})`} />
        <circle cx="320" cy="210" r="52" fill="#fff3c4" />
        <rect y="238" width="640" height="162" fill={`url(#sw-${id})`} />
        <g opacity="0.5" stroke="#ffe9b0" strokeWidth="4" strokeLinecap="round">
          <path d="M300 268 h40 M280 296 h80 M260 330 h120" />
        </g>
        <g fill="#05171d" opacity="0.85">
          <path d="M0 250 C120 236 240 244 360 238 C480 232 560 240 640 234 L640 244 L0 256 Z" opacity="0.5" />
          <g transform="translate(470 236)">
            <rect x="-70" y="-52" width="150" height="48" rx="5" />
            <path d="M-84,-52 L96,-52 L78,-76 L-64,-76 Z" />
            {[-52, -30, -6, 18, 42, 64].map((dx) => (
              <rect key={dx} x={dx} y="-4" width="5" height="26" />
            ))}
          </g>
          <g transform="translate(90 250)">
            <rect x="-3" y="-58" width="6" height="60" />
            <path d="M0,-60 C-30,-74 -44,-56 -52,-42 C-32,-54 -12,-58 0,-60 Z" />
            <path d="M0,-60 C30,-74 44,-56 52,-42 C32,-54 12,-58 0,-60 Z" />
            <path d="M0,-64 C-8,-84 10,-86 20,-76 C6,-74 0,-70 0,-64 Z" />
          </g>
          {[150, 210, 560].map((x, i) => (
            <path key={x} d={`M${x} ${232 + i * 6} q6,-8 14,0 q-7,3 -14,0`} />
          ))}
        </g>
        <path d="M0 376 Q160 366 320 374 T640 370 L640 400 L0 400 Z" fill="#05171d" opacity="0.45" />
      </svg>
    );
  }

  // beach
  return (
    <svg viewBox="0 0 640 400" className={className} role="img" aria-label={`Beach at ${resort.name}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bh-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 50% 78%)`} />
          <stop offset="1" stopColor={`hsl(${h} 45% 88%)`} />
        </linearGradient>
        <linearGradient id={`bw-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 62% 58%)`} />
          <stop offset="1" stopColor={`hsl(${h} 58% 48%)`} />
        </linearGradient>
      </defs>
      <rect width="640" height="200" fill={`url(#bh-${id})`} />
      <rect y="196" width="640" height="96" fill={`url(#bw-${id})`} />
      <path d="M0 282 Q160 268 320 278 T640 272 L640 400 L0 400 Z" fill={sandC} />
      <g opacity="0.4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
        <path d="M30 230 h56 M150 242 h44 M330 232 h62 M470 244 h50 M560 230 h54" />
      </g>
      <g transform="translate(150 300)">
        <path d="M0 0 q10,-46 4,-86" stroke={roof} strokeWidth="6" fill="none" />
        <path d="M4,-88 C-34,-104 -52,-80 -62,-62 C-40,-76 -16,-84 4,-88 Z" fill={`hsl(${h + 55} 40% 38%)`} />
        <path d="M4,-88 C42,-104 60,-80 70,-62 C48,-76 24,-84 4,-88 Z" fill={`hsl(${h + 55} 40% 38%)`} />
        <path d="M4,-92 C-4,-114 16,-116 28,-104 C12,-102 4,-98 4,-92 Z" fill={`hsl(${h + 55} 40% 44%)`} />
      </g>
      <g transform="translate(460 322)">
        <rect x="-70" y="-70" width="150" height="60" rx="6" fill={villaWall} />
        <path d="M-84,-70 L96,-70 L76,-98 L-62,-98 Z" fill={roof} />
        <rect x="-34" y="-56" width="44" height="30" rx="3" fill={`hsl(${h} 35% 65%)`} opacity="0.8" />
        <rect x="-90" y="-8" width="180" height="8" rx="4" fill={sandC} />
      </g>
      <g transform="translate(300 350)" opacity="0.9">
        <path d="M-30 0 h60 l-8 12 h-44 Z" fill={`hsl(${h} 70% 55%)`} />
        <path d="M0 -26 l22 24 h-44 Z" fill="#ffffff" />
      </g>
    </svg>
  );
}
