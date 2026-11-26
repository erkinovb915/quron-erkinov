// Fon: miltillovchi yulduzlar va suzib yuruvchi oltin zarralar
export function startSky(canvas) {
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dpr, stars, dust;

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    const n = Math.round((innerWidth * innerHeight) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.2 + 0.3) * dpr,
      p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5,
    }));
    dust = Array.from({ length: Math.round(n / 3) }, () => newDust(true));
  }
  function newDust(anywhere) {
    return {
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, r: (Math.random() * 2 + 0.8) * dpr,
      vy: -(0.15 + Math.random() * 0.45) * dpr, vx: (Math.random() - 0.5) * 0.2 * dpr, a: 0.2 + Math.random() * 0.5,
    };
  }
  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const tt = time / 1000;
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + tt * s.s));
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = "#fff8dc";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      d.x += d.vx + Math.sin(tt + i) * 0.1;
      d.y += d.vy;
      if (d.y < -10) dust[i] = newDust(false);
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
      g.addColorStop(0, `rgba(243,217,139,${d.a})`);
      g.addColorStop(1, "rgba(243,217,139,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduce && !document.hidden) requestAnimationFrame(draw);
  }
  resize();
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduce) requestAnimationFrame(draw); });
  requestAnimationFrame(draw);
}
