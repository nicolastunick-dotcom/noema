import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NoemaOrb — sphère 3D animée sur Canvas
// Props : size (px, défaut 60), showText (boolean)
// ─────────────────────────────────────────────────────────────────────────────

const TEXTS = [
  "Noema réfléchit...",
  "Exploration en cours...",
  "Analyse profonde...",
  "Connexion établie...",
];

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}
function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export default function NoemaOrb({ size = 60, showText = false }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef({ rotY: 0 });
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    if (!showText) return;
    const id = setInterval(() => setTextIdx(i => (i + 1) % TEXTS.length), 2500);
    return () => clearInterval(id);
  }, [showText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const W = 800, H = 800;
    canvas.width  = W;
    canvas.height = H;
    const cx = W / 2, cy = H / 2;

    const SPHERE_R = 340;
    const FOCAL    = 720;
    const TILT_X   = 0.22;

    // ── Points sphère (Fibonacci) ───────────────────────────────────────────
    const N_PTS      = 220;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const sphPoints  = [];
    for (let i = 0; i < N_PTS; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi   = Math.acos(1 - (2 * (i + 0.5)) / N_PTS);
      sphPoints.push({
        x: SPHERE_R * Math.sin(phi) * Math.cos(theta),
        y: SPHERE_R * Math.sin(phi) * Math.sin(theta),
        z: SPHERE_R * Math.cos(phi),
      });
    }

    // ── 6 anneaux orbitaux aux couleurs Noema ──────────────────────────────
    // primary: #bdc2ff [189,194,255] | primaryContainer: #7886ff [120,134,255] | tertiary: #ffb68a [255,182,138]
    const ringDefs = [
      { normal: normalize({ x: 0,   y: 1,   z: 0   }), rgb: [120, 134, 255], width: 1.4 }, // équatorial, primaryContainer
      { normal: normalize({ x: 1,   y: 0,   z: 0   }), rgb: [189, 194, 255], width: 1.2 }, // vertical, primary
      { normal: normalize({ x: 0.7, y: 0.7, z: 0   }), rgb: [255, 182, 138], width: 1.0 }, // diag 45°, tertiary
      { normal: normalize({ x: 0,   y: 0.4, z: 1   }), rgb: [120, 134, 255], width: 1.1 }, // incliné avant, primaryContainer
      { normal: normalize({ x: 1,   y: 0.5, z: 0.6 }), rgb: [189, 194, 255], width: 1.0 }, // incliné complexe, primary
      { normal: normalize({ x: 0.5, y: 0.8, z: 0.7 }), rgb: [255, 182, 138], width: 0.9 }, // diag 3D, tertiary
    ];

    const rings = ringDefs.map((def, i) => {
      const n   = def.normal;
      const arb = Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
      const u   = normalize(cross(n, arb));
      const v   = cross(n, u);
      return {
        ...def, u, v,
        pulseAngle: (i * Math.PI * 2) / 6,
        pulseSpeed: 0.018 + i * 0.004,
      };
    });

    // ── Projection 3D → 2D ─────────────────────────────────────────────────
    function project(x, y, z) {
      const ry = stateRef.current.rotY;
      const x1 =  x * Math.cos(ry) + z * Math.sin(ry);
      const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y2 =  y * Math.cos(TILT_X) - z1 * Math.sin(TILT_X);
      const z2 =  y * Math.sin(TILT_X) + z1 * Math.cos(TILT_X);
      const d  = FOCAL / (FOCAL + z2 + 350);
      return { sx: cx + x1 * d, sy: cy + y2 * d, sz: z2, sc: d };
    }

    function ringPt(ring, angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return {
        x: SPHERE_R * (c * ring.u.x + s * ring.v.x),
        y: SPHERE_R * (c * ring.u.y + s * ring.v.y),
        z: SPHERE_R * (c * ring.u.z + s * ring.v.z),
      };
    }

    const SEGS = 110;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // ── Halo ambiant ───────────────────────────────────────────────────
      const gBg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
      gBg.addColorStop(0, "rgba(90, 70, 200, 0.15)");
      gBg.addColorStop(0.5, "rgba(90, 70, 200, 0.05)");
      gBg.addColorStop(1, "rgba(90, 70, 200, 0)");
      ctx.fillStyle = gBg;
      ctx.fillRect(0, 0, W, H);

      // ── Lettrine "N" + brume — dessinées AVANT les anneaux (visuellement à l'intérieur) ──
      const fontSize = Math.round(W * 0.30);

      // Brume intérieure — radial gradient doux violet
      const gMist = ctx.createRadialGradient(cx, cy, 0, cx, cy, SPHERE_R * 0.72);
      gMist.addColorStop(0,   "rgba(100, 80, 220, 0.22)");
      gMist.addColorStop(0.5, "rgba(80,  60, 180, 0.10)");
      gMist.addColorStop(1,   "rgba(60,  40, 140, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, SPHERE_R * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = gMist;
      ctx.fill();

      // Lettrine N — glow réduit, aspect intérieur
      ctx.save();
      ctx.font         = `italic ${fontSize}px 'Instrument Serif', Georgia, serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      // Halo large très doux (réduit)
      ctx.fillStyle = "rgba(120, 100, 240, 0.05)";
      for (let dx = -6; dx <= 6; dx += 3) {
        for (let dy = -6; dy <= 6; dy += 3) {
          ctx.fillText("N", cx + dx, cy + dy);
        }
      }
      // Lettre principale — moins lumineuse, plus enfouie
      ctx.shadowColor = "rgba(140, 120, 255, 0.55)";
      ctx.shadowBlur  = 28;
      ctx.fillStyle   = "rgba(210, 205, 255, 0.62)";
      ctx.fillText("N", cx, cy);
      ctx.restore();

      // ── Points sphère ─────────────────────────────────────────────────
      const projected = sphPoints.map(p => project(p.x, p.y, p.z));
      projected.sort((a, b) => a.sz - b.sz);

      for (const p of projected) {
        const depth  = (p.sz + SPHERE_R) / (2 * SPHERE_R);
        const alpha  = 0.08 + depth * 0.52;
        const radius = (0.9 + depth * 2.0) * p.sc;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(189,194,255,${alpha})`;
        ctx.fill();
      }

      // ── 6 Anneaux + pulses ─────────────────────────────────────────────
      for (const ring of rings) {
        ring.pulseAngle += ring.pulseSpeed;

        for (let i = 0; i < SEGS; i++) {
          const a1  = (i / SEGS) * Math.PI * 2;
          const a2  = ((i + 1) / SEGS) * Math.PI * 2;
          const pt1 = ringPt(ring, a1);
          const pt2 = ringPt(ring, a2);
          const p1  = project(pt1.x, pt1.y, pt1.z);
          const p2  = project(pt2.x, pt2.y, pt2.z);

          const depth = (p1.sz + SPHERE_R) / (2 * SPHERE_R);
          const alpha = 0.07 + depth * 0.32;
          const [r, g, b] = ring.rgb;

          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth   = ring.width * p1.sc;
          ctx.stroke();
        }

        // Pulse — couleur adaptée à l'anneau
        const pp3d   = ringPt(ring, ring.pulseAngle);
        const pp     = project(pp3d.x, pp3d.y, pp3d.z);
        const depth  = (pp.sz + SPHERE_R) / (2 * SPHERE_R);
        const pAlpha = 0.35 + depth * 0.65;
        const pSize  = 13 * pp.sc;

        // Choisit la couleur du pulse selon l'anneau
        const [pr, pg, pb] = ring.rgb[0] === 255
          ? [255, 182, 138]   // tertiary → pulse ambre
          : [189, 194, 255];  // primary/primaryContainer → pulse lavande

        const gPulse = ctx.createRadialGradient(pp.sx, pp.sy, 0, pp.sx, pp.sy, pSize * 3);
        gPulse.addColorStop(0, `rgba(${pr},${pg},${pb},${pAlpha * 0.8})`);
        gPulse.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
        ctx.beginPath();
        ctx.arc(pp.sx, pp.sy, pSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gPulse;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pp.sx, pp.sy, pSize * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${pAlpha})`;
        ctx.fill();
      }


      // ── Brume intérieure — clippée à la sphère, ne sort pas ──────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, SPHERE_R * 0.92, 0, Math.PI * 2);
      ctx.clip(); // tout ce qui suit est masqué hors de la sphère

      const gVig = ctx.createRadialGradient(cx, cy, SPHERE_R * 0.35, cx, cy, SPHERE_R * 0.92);
      gVig.addColorStop(0,   "rgba(8, 9, 16, 0)");
      gVig.addColorStop(0.55,"rgba(8, 9, 16, 0.15)");
      gVig.addColorStop(1,   "rgba(8, 9, 16, 0.52)");
      ctx.beginPath();
      ctx.arc(cx, cy, SPHERE_R * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = gVig;
      ctx.fill();
      ctx.restore();

      stateRef.current.rotY -= 0.004;
      animRef.current = requestAnimationFrame(draw);
    }

    // Attend que les polices soient chargées avant de démarrer
    document.fonts.ready.then(() => { draw(); });

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: "block" }}
      />
      {showText && (
        <span style={{
          fontSize:      "0.75rem",
          color:         "#bdc2ff",
          opacity:       0.75,
          fontFamily:    "'Figtree', sans-serif",
          letterSpacing: "0.06em",
          transition:    "opacity 0.4s",
        }}>
          {TEXTS[textIdx]}
        </span>
      )}
    </div>
  );
}
