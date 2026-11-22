(() => {
  "use strict";

  const chart = document.getElementById("study-chart");
  if (!chart) return;

  // Figure 5. Each interval belongs to the estimate immediately before it.
  const methods = ["Raw max-stack", "Google-style", "FLUX.2 klein", "GPT Image 2"];
  const panels = [
    {
      title: "Appearance",
      estimates: [[70.7, 65.625, 76.009], [82.2, 76.646, 87.254],
        [40.6, 29.545, 51.795], [35.7, 28.693, 42.762]]
    },
    {
      title: "Input consistency",
      estimates: [[64.7, 59.680, 69.907], [80.4, 75.284, 85.227],
        [90.8, 86.174, 94.602], [77.6, 69.508, 84.375]]
    }
  ];
  const blue = "#247da7";
  const gray = "#dde2e6";
  const whisker = "#26313a";
  const axis = "#888e94";
  const description = panels.map(panel => panel.title + ". " +
    panel.estimates.map(([rate], i) => `Against ${methods[i]}, ${rate}%.`).join(" ")
  ).join(" ");

  function label(x, y, words, extra = "") {
    return `<text x="${x}" y="${y}" ${extra}>${words}</text>`;
  }

  function line(x1, y1, x2, y2, color, extra = "") {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
  }

  function rect(x, y, w, h, fill, extra = "") {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  }

  function drawPanel(panel, index, compact) {
    const x = compact ? 16 : 200 + 426 * index;
    const w = compact ? 378 : 344;
    const top = compact ? 132 + 414 * index : 170;
    const step = compact ? 77 : 98.5;
    const h = compact ? 29 : 71;
    const bottom = top + 3 * step + h + (compact ? 23 : 29);
    const mid = x + w / 2;
    const pct = p => x + w * p / 100;
    let bars = "";
    let markings = "";

    for (const [i, [rate, low, high]] of panel.estimates.entries()) {
      const y = top + step * i;
      const end = pct(rate);
      const center = (x + end) / 2;
      const cy = y + h + (compact ? 8 : 11);
      bars += rect(x, y, w, h, gray) + rect(x, y, end - x, h, blue);
      if (compact) {
        markings += label(x, y - 7, methods[i], 'font-size="16"');
        markings += label(center, y + 20, `Ours ${rate.toFixed(1)}%`, 'font-size="17" font-weight="bold" fill="white" text-anchor="middle"');
      } else {
        if (index === 0) {
          markings += label(186, y + h / 2, methods[i], `font-size="32" text-anchor="end" transform="rotate(-49 186 ${y + h / 2})"`);
        }
        markings += label(center, y + 27, "Ours", 'text-anchor="middle" fill="white" font-weight="bold" font-size="31"');
        markings += label(center, y + 57, rate.toFixed(1) + "%", 'text-anchor="middle" fill="white" font-weight="bold" font-size="31"');
      }
      const tick = compact ? 3 : 4;
      markings += `<g stroke-width="${compact ? 2 : 3}">` +
        line(pct(low), cy, pct(high), cy, whisker) +
        line(pct(low), cy - tick, pct(low), cy + tick, whisker) +
        line(pct(high), cy - tick, pct(high), cy + tick, whisker) +
        `<circle cx="${end}" cy="${cy}" r="${compact ? 4 : 6}" fill="${whisker}"/></g>`;
    }

    const boxY = top - (compact ? 49 : 48);
    const boxW = compact ? 44 : 66;
    const boxH = compact ? 23 : 40;
    const tickFont = compact ? 18 : 30;
    return label(mid, boxY - (compact ? 11 : 20), panel.title,
      `text-anchor="middle" font-weight="bold" font-size="${compact ? 25 : 32}"`) +
      bars +
      line(mid, boxY + boxH + 3, mid, bottom, "#535e69", `stroke-width="${compact ? 2 : 3}" stroke-dasharray="${compact ? "5 4" : "8 6"}"`) +
      rect(mid - boxW / 2, boxY, boxW, boxH, "white", 'stroke="#757f8b" stroke-width="1.8"') +
      label(mid, boxY + (compact ? 17 : 29), "50%", `text-anchor="middle" font-size="${tickFont}"`) +
      markings +
      `<path d="M${x} ${bottom + 7}v-7h${w}v7" fill="none" stroke="${axis}" stroke-width="2.5"/>` +
      label(x, bottom + (compact ? 24 : 42), "0%", `font-size="${tickFont}"`) +
      label(x + w, bottom + (compact ? 24 : 42), "100%", `text-anchor="end" font-size="${tickFont}"`);
  }

  let previousLayout;
  function render() {
    const compact = chart.clientWidth < 650;
    if (compact === previousLayout) return;
    previousLayout = compact;
    const legend = compact
      ? rect(79, 10, 23, 14, blue) + label(109, 23, "Ours") +
        rect(167, 10, 23, 14, gray) + label(197, 23, "Compared method")
      : rect(382, 27, 41, 23, blue) + label(436, 49, "Ours") +
        rect(538, 27, 41, 23, gray) + label(592, 49, "Compared method") +
        label(185, 99, "Compared with", 'font-style="italic" text-anchor="end" transform="rotate(-49 185 99)"');
    chart.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${compact ? "410 869" : "1000 650"}"
      role="img" aria-labelledby="study-chart-title study-chart-description" font-family="'Times New Roman', Times, serif"
      fill="#101010" style="display:block;width:100%;height:auto;background:white">
      <title id="study-chart-title">Pairwise user preference for HLTFusion</title>
      <desc id="study-chart-description">${description} The dashed line marks equal preference.
      Whiskers show the intervals plotted in Figure 5.</desc>
      <g font-size="${compact ? 18 : 32}">${legend}</g>
      ${panels.map((panel, index) => drawPanel(panel, index, compact)).join("")}
    </svg>`;
  }

  render();
  if ("ResizeObserver" in window) {
    new ResizeObserver(render).observe(chart);
  } else {
    window.addEventListener("resize", render);
  }
})();
