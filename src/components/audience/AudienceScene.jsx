import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── Character color palette ──────────────────────────────────────────────────
const COLORS = [
  { body: "#181822", light: "#3a3a52", dark: "#0d0d14" },
  { body: "#841b2d", light: "#c4405a", dark: "#5a121f" },
  { body: "#283478", light: "#4a5fc0", dark: "#1a224f" },
  { body: "#e2d9cc", light: "#f5f0e8", dark: "#b8ad9c" },
  { body: "#0f5132", light: "#1f8050", dark: "#0a3822" },
  { body: "#d97706", light: "#f59e0b", dark: "#94520a" },
  { body: "#7c3aed", light: "#a855f7", dark: "#5b21b6" },
  { body: "#0891b2", light: "#22d3ee", dark: "#065f70" },
  { body: "#be123c", light: "#f43f5e", dark: "#7f0d28" },
  { body: "#15803d", light: "#22c55e", dark: "#0d5028" },
  { body: "#b45309", light: "#d97706", dark: "#7c2d12" },
  { body: "#4f46e5", light: "#818cf8", dark: "#312e81" },
];

const ACCESSORIES = ["cone", "punk", "headphone", "halo", "antenna"];

const lerp = (a, b, t) => a + (b - a) * t;
const clampMag = (x, y, max) => {
  const mag = Math.sqrt(x * x + y * y);
  if (mag > max) return [x / mag * max, y / mag * max];
  return [x, y];
};

export default function AudienceScene({ fixed = true, showLaptop = true, count = 14 }) {
  const svgRef = useRef(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const charDataRef = useRef([]);
  const [, setTick] = useState(0);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 800 });
  const [termLines, setTermLines] = useState([]);
  const [particles, setParticles] = useState([]);

  // Initialize characters
  useEffect(() => {
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const chars = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col + 0.5 + (Math.random() - 0.5) * 0.15) / cols;
      const y = (row + 0.3 + (Math.random() - 0.5) * 0.12) / Math.max(rows, 3);
      chars.push({
        id: i, x, y, baseX: x, baseY: y,
        size: 38 + Math.random() * 18,
        color: COLORS[i % COLORS.length],
        accessory: ACCESSORIES[i % ACCESSORIES.length],
        gazeX: 0, gazeY: 0, targetGazeX: 0, targetGazeY: 0,
        pupilX: 0, pupilY: 0, targetPupilX: 0, targetPupilY: 0,
        blinkTimer: 0, nextBlink: 2500 + Math.random() * 4000, blinkPhase: 0,
        bouncePhase: 0, bounceVel: 0,
        breathePhase: Math.random() * Math.PI * 2,
        breatheSpeed: 0.0008 + Math.random() * 0.0006,
        toast: "", toastTimer: 0,
      });
    }
    charDataRef.current = chars;
    setTick(t => t + 1);
  }, [count]);

  // Track viewport size
  useEffect(() => {
    const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Global mouse tracking (-1 to 1)
  useEffect(() => {
    const onMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // 60 FPS animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const chars = charDataRef.current;
      if (!chars.length) { rafRef.current = requestAnimationFrame(animate); return; }
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const c of chars) {
        // Breathing / floating
        c.breathePhase += dt * c.breatheSpeed;
        c.x = c.baseX + Math.sin(c.breathePhase) * 0.004;
        c.y = c.baseY + Math.sin(c.breathePhase * 0.7 + 1.3) * 0.006;

        // Gaze target
        const dx = mx - c.x * 2;
        const dy = my - c.y * 2;
        const mag = Math.sqrt(dx * dx + dy * dy);
        c.targetGazeX = mag > 0 ? (dx / mag) * Math.min(mag * 0.5, 0.6) : 0;
        c.targetGazeY = mag > 0 ? (dy / mag) * Math.min(mag * 0.5, 0.6) : 0;

        // Smooth damping (lerp 0.08)
        c.gazeX = lerp(c.gazeX, c.targetGazeX, 0.08);
        c.gazeY = lerp(c.gazeY, c.targetGazeY, 0.08);

        // Pupils
        const [px, py] = clampMag(c.gazeX, c.gazeY, 1);
        c.targetPupilX = px;
        c.targetPupilY = py;
        c.pupilX = lerp(c.pupilX, c.targetPupilX, 0.12);
        c.pupilY = lerp(c.pupilY, c.targetPupilY, 0.12);

        // Blink cycle
        c.blinkTimer += dt;
        if (c.blinkTimer >= c.nextBlink) {
          const blinkDur = 160;
          const elapsed = c.blinkTimer - c.nextBlink;
          if (elapsed < blinkDur / 2) c.blinkPhase = elapsed / (blinkDur / 2);
          else if (elapsed < blinkDur) c.blinkPhase = 1 - (elapsed - blinkDur / 2) / (blinkDur / 2);
          else { c.blinkPhase = 0; c.blinkTimer = 0; c.nextBlink = 2500 + Math.random() * 4000; }
        }

        // Bounce physics
        if (Math.abs(c.bouncePhase) > 0.001 || Math.abs(c.bounceVel) > 0.001) {
          c.bounceVel += -c.bouncePhase * 0.15;
          c.bounceVel *= 0.9;
          c.bouncePhase += c.bounceVel;
        }

        // Toast timer
        if (c.toastTimer > 0) { c.toastTimer -= dt; if (c.toastTimer <= 0) c.toast = ""; }
      }

      setTick(t => t + 1);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Click handler
  const handleCharClick = useCallback((id) => {
    const chars = charDataRef.current;
    const c = chars.find(c => c.id === id);
    if (!c) return;
    c.bounceVel = 0.15;
    const messages = ["🎉 Awesome!", "✨ Nice!", "🚀 Let's go!", "💡 Brilliant!", "🔥 Fired up!", "⭐ Great!"];
    c.toast = messages[Math.floor(Math.random() * messages.length)];
    c.toastTimer = 2000;
  }, []);

  // Terminal text
  useEffect(() => {
    const phrases = [
      "$ npm run build", "✓ 66 modules transformed", "$ git push origin main",
      "✓ deployed to vercel", "$ jest --coverage", "✓ 142 tests passed",
      "$ docker compose up", "✓ container running", "$ eslint src/", "✓ no warnings",
      "$ tsc --noEmit", "✓ type check passed",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setTermLines(prev => [...prev, phrases[idx++ % phrases.length]].slice(-5));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Network particles
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = charDataRef.current;
      if (chars.length < 2) return;
      const from = Math.floor(Math.random() * chars.length);
      let to = Math.floor(Math.random() * chars.length);
      while (to === from) to = Math.floor(Math.random() * chars.length);
      setParticles(prev => [...prev.filter(p => p.t < 1), { from, to, t: 0, speed: 0.003 + Math.random() * 0.004 }]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, t: p.t + p.speed })).filter(p => p.t < 1));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const W = dimensions.w, H = dimensions.h;
  const chars = charDataRef.current;

  const getPos = (c) => {
    const px = c.x * W;
    const py = c.y * H * 0.85 + H * 0.08;
    const bounce = c.bouncePhase * 30;
    const tiltX = c.gazeX * 12, tiltY = c.gazeY * 8;
    return { px: px + tiltX, py: py + tiltY - bounce };
  };

  // Network lines
  const networkLines = [];
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      const a = chars[i], b = chars[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist < 0.25) {
        const pa = getPos(a), pb = getPos(b);
        networkLines.push({ x1: pa.px, y1: pa.py, x2: pb.px, y2: pb.py, op: (0.25 - dist) * 0.4 });
      }
    }
  }

  // Accessory renderer
  const renderAccessory = (c, cx, cy, r) => {
    switch (c.accessory) {
      case "cone":
        return (<g key="cone">
          <polygon points={`${cx-r*0.5},${cy-r*0.8} ${cx+r*0.5},${cy-r*0.8} ${cx},${cy-r*1.9}`} fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
          <rect x={cx-r*0.35} y={cy-r*1.15} width={r*0.7} height={r*0.12} fill="#fff" rx="2" />
          <rect x={cx-r*0.25} y={cy-r*1.45} width={r*0.5} height={r*0.1} fill="#fff" rx="2" />
          <ellipse cx={cx} cy={cy-r*0.8} rx={r*0.5} ry={r*0.15} fill="#ea580c" />
        </g>);
      case "punk":
        return (<g key="punk">
          {[0,1,2,3,4,5,6].map(i => {
            const angle = -Math.PI/2 + (i - 3) * 0.35;
            return <line key={i} x1={cx+Math.cos(angle)*r*0.85} y1={cy+Math.sin(angle)*r*0.85} x2={cx+Math.cos(angle)*r*1.6} y2={cy+Math.sin(angle)*r*1.6} stroke={c.color.light} strokeWidth="4" strokeLinecap="round" />;
          })}
        </g>);
      case "headphone":
        return (<g key="hp">
          <path d={`M ${cx-r*0.95} ${cy-r*0.2} Q ${cx} ${cy-r*1.3} ${cx+r*0.95} ${cy-r*0.2}`} fill="none" stroke="#1a1a2e" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx={cx-r*0.95} cy={cy-r*0.15} rx={r*0.25} ry={r*0.3} fill="#1a1a2e" />
          <ellipse cx={cx+r*0.95} cy={cy-r*0.15} rx={r*0.25} ry={r*0.3} fill="#1a1a2e" />
          <circle cx={cx-r*0.95} cy={cy-r*0.15} r={r*0.12} fill="#22d3ee"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx={cx+r*0.95} cy={cy-r*0.15} r={r*0.12} fill="#22d3ee"><animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" /></circle>
        </g>);
      case "halo":
        return (<g key="halo">
          <ellipse cx={cx} cy={cy-r*1.3} rx={r*0.7} ry={r*0.18} fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.8"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" /></ellipse>
          <ellipse cx={cx} cy={cy-r*1.3} rx={r*0.7} ry={r*0.18} fill="none" stroke="#fde68a" strokeWidth="1" opacity="0.5"><animate attributeName="rx" values={`${r*0.65};${r*0.75};${r*0.65}`} dur="3s" repeatCount="indefinite" /></ellipse>
        </g>);
      case "antenna":
        return (<g key="ant">
          <line x1={cx} y1={cy-r*0.7} x2={cx} y2={cy-r*1.8} stroke={c.color.light} strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy-r*1.9} r={r*0.15} fill="#ef4444"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" /></circle>
          <circle cx={cx} cy={cy-r*1.9} r={r*0.25} fill="#ef4444" opacity="0.3"><animate attributeName="r" values={`${r*0.15};${r*0.3};${r*0.15}`} dur="1s" repeatCount="indefinite" /></circle>
        </g>);
      default: return null;
    }
  };

  // Character renderer
  const renderChar = (c) => {
    const { px, py } = getPos(c);
    const r = c.size;
    const headTilt = c.gazeX * 8;
    const lidScale = 1 - c.blinkPhase * 0.95;
    const eyeOX = r * 0.32, eyeOY = -r * 0.05;
    const eyeR = r * 0.28, pupilR = r * 0.13;
    const pupilMax = eyeR - pupilR - 2;
    const [pdx, pdy] = clampMag(c.pupilX, c.pupilY, 1);
    const lpX = pdx * pupilMax, lpY = pdy * pupilMax;
    const gid = `g-${c.id}`, sid = `s-${c.id}`;

    return (
      <g key={c.id} transform={`translate(${px}, ${py}) rotate(${headTilt})`}
        style={{ cursor: 'pointer' }}
        onClick={() => handleCharClick(c.id)}
        onMouseEnter={() => { c.bounceVel = 0.08; }}
      >
        <ellipse cx="0" cy={r * 0.75} rx={r * 0.6} ry={r * 0.15} fill="rgba(0,0,0,0.25)" />
        {renderAccessory(c, 0, 0, r)}
        <defs>
          <radialGradient id={gid} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={c.color.light} />
            <stop offset="40%" stopColor={c.color.body} />
            <stop offset="100%" stopColor={c.color.dark} />
          </radialGradient>
          <radialGradient id={sid} cx="30%" cy="25%" r="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx={r * 0.75} ry={r * 0.9} fill={`url(#${gid})`} stroke={c.color.dark} strokeWidth="1" />
        <ellipse cx={-r * 0.22} cy={-r * 0.35} rx={r * 0.3} ry={r * 0.22} fill={`url(#${sid})`} />
        <g transform={`translate(${-eyeOX}, ${eyeOY}) scale(1, ${lidScale})`}>
          <ellipse cx="0" cy="0" rx={eyeR} ry={eyeR} fill="white" />
          <circle cx={lpX} cy={lpY} r={pupilR} fill="#1a1a2e" />
          <circle cx={lpX - pupilR * 0.3} cy={lpY - pupilR * 0.3} r={pupilR * 0.35} fill="white" opacity="0.9" />
        </g>
        <g transform={`translate(${eyeOX}, ${eyeOY}) scale(1, ${lidScale})`}>
          <ellipse cx="0" cy="0" rx={eyeR} ry={eyeR} fill="white" />
          <circle cx={lpX} cy={lpY} r={pupilR} fill="#1a1a2e" />
          <circle cx={lpX - pupilR * 0.3} cy={lpY - pupilR * 0.3} r={pupilR * 0.35} fill="white" opacity="0.9" />
        </g>
        {c.blinkPhase > 0.01 && (<>
          <ellipse cx={-eyeOX} cy={eyeOY} rx={eyeR * 1.05} ry={eyeR * (1 - c.blinkPhase)} fill={c.color.body} />
          <ellipse cx={eyeOX} cy={eyeOY} rx={eyeR * 1.05} ry={eyeR * (1 - c.blinkPhase)} fill={c.color.body} />
        </>)}
        <path d={`M ${-r*0.2} ${r*0.3} Q 0 ${r*0.42} ${r*0.2} ${r*0.3}`} fill="none" stroke={c.color.dark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {c.toast && c.toastTimer > 0 && (
          <g transform={`translate(0, ${-r * 1.8})`} opacity={Math.min(c.toastTimer / 500, 1)}>
            <rect x={-45} y={-16} width={90} height={28} rx={14} fill="rgba(0,0,0,0.85)" />
            <text x="0" y="2" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">{c.toast}</text>
          </g>
        )}
      </g>
    );
  };

  // Laptop renderer
  const renderLaptop = () => {
    if (!showLaptop) return null;
    const lx = W * 0.5, ly = H * 0.72, lw = 280, lh = 180;
    return (
      <g key="laptop" transform={`translate(${lx}, ${ly})`}>
        <ellipse cx="0" cy={-lh * 0.3} rx={lw * 0.6} ry={lh * 0.5} fill="#1e293b" opacity="0.3" />
        <rect x={-lw / 2} y={-lh} width={lw} height={lh} rx={8} fill="#0f0f1a" stroke="#1a1a2e" strokeWidth="2" />
        <rect x={-lw / 2 + 8} y={-lh + 8} width={lw - 16} height={lh - 16} rx={4} fill="#0a0a12" />
        {termLines.map((line, i) => (
          <text key={i} x={-lw / 2 + 16} y={-lh + 24 + i * 22} fill={line.includes("✓") ? "#22c55e" : "#6b7280"} fontSize="10" fontFamily="'JetBrains Mono', monospace" opacity={1 - (termLines.length - 1 - i) * 0.15}>
            {line}
          </text>
        ))}
        <rect x={-lw / 2 + 16 + (termLines.length > 0 ? termLines[termLines.length - 1].length * 6.5 : 0)} y={-lh + 16 + Math.max(termLines.length - 1, 0) * 22} width={8} height={12} fill="#22c55e">
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </rect>
        <polygon points={`${-lw / 2 - 20},0 ${lw / 2 + 20},0 ${lw / 2 + 30},12 ${-lw / 2 - 30},12`} fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
        <polygon points={`${-lw / 2 - 20},0 ${lw / 2 + 20},0 ${lw / 2 + 10},-3 ${-lw / 2 - 10},-3`} fill="#15152a" />
      </g>
    );
  };

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
      style={fixed ? { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 } : { width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="50%" stopColor="#0d0d1a" />
          <stop offset="100%" stopColor="#080812" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bgGlow)" />
      <g style={{ pointerEvents: 'none' }}>
        {networkLines.map((l, i) => (
          <line key={`net-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#3b82f6" strokeWidth="1" opacity={l.op * 0.5}>
            <animate attributeName="opacity" values={`${l.op * 0.3};${l.op * 0.6};${l.op * 0.3}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </line>
        ))}
      </g>
      <g style={{ pointerEvents: 'none' }}>
        {particles.map((p, i) => {
          const fc = chars[p.from], tc = chars[p.to];
          if (!fc || !tc) return null;
          const pa = getPos(fc), pb = getPos(tc);
          const x = pa.px + (pb.px - pa.px) * p.t;
          const y = pa.py + (pb.py - pa.py) * p.t;
          return <circle key={`p-${i}`} cx={x} cy={y} r="3" fill="#60a5fa" opacity={1 - p.t}><animate attributeName="r" values="2;4;2" dur="0.5s" repeatCount="indefinite" /></circle>;
        })}
      </g>
      {renderLaptop()}
      <g style={{ pointerEvents: 'auto' }}>
        {chars.map(c => renderChar(c))}
      </g>
    </svg>
  );
}
