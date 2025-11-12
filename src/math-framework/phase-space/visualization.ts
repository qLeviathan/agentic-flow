/**
 * Phase Space Visualization System
 * D3.js-based visualization for phase portraits and trajectories
 */

import {
  PhaseSpaceCoordinates,
  TrajectoryPoint,
  NashPoint,
  PhasePortraitConfig,
  VisualizationData
} from './types';

/**
 * Color schemes for phase space visualization
 */
const COLOR_SCHEMES = {
  viridis: [
    '#440154', '#481567', '#482677', '#453781', '#404788',
    '#39568C', '#33638D', '#2D708E', '#287D8E', '#238A8D',
    '#1F968B', '#20A387', '#29AF7F', '#3CBB75', '#55C667',
    '#73D055', '#95D840', '#B8DE29', '#DCE319', '#FDE725'
  ],
  plasma: [
    '#0D0887', '#2E0594', '#47039F', '#5901A5', '#6A00A8',
    '#7B0FA0', '#8A1C96', '#99288A', '#A6337C', '#B23E6E',
    '#BD4A60', '#C75653', '#D06347', '#D8713C', '#DF8031',
    '#E58F27', '#EA9F1E', '#EFB01A', '#F3C11A', '#F7D31F'
  ],
  inferno: [
    '#000004', '#0B0523', '#1F0C48', '#36106C', '#50127C',
    '#67147B', '#7E1876', '#94216A', '#A92E5E', '#BC3D51',
    '#CD4E45', '#DB6039', '#E6732E', '#EF8627', '#F69A24',
    '#FBAF27', '#FDC52F', '#FEDC3D', '#FDF252', '#FCFFA4'
  ],
  magma: [
    '#000004', '#0B0723', '#1F0F47', '#36176A', '#4F1C7F',
    '#681F8D', '#812194', '#992597', '#B12A90', '#C63187',
    '#D9407D', '#E85273', '#F2676A', '#F77E63', '#FA955F',
    '#FCAC5F', '#FDC467', '#FCDC73', '#F9F285', '#FCFFA4'
  ]
};

/**
 * SVG generation for phase space plot
 */
export function generatePhasePlotSVG(
  trajectory: TrajectoryPoint[],
  nashPoints: NashPoint[],
  config: Partial<PhasePortraitConfig> = {}
): string {
  const defaultConfig: PhasePortraitConfig = {
    nMin: 1,
    nMax: 100,
    step: 1,
    colorScheme: 'viridis',
    highlightNashPoints: true,
    showVectorField: false,
    resolution: 800
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { resolution, colorScheme, highlightNashPoints } = finalConfig;

  // Extract coordinates
  const coords = trajectory.map(t => t.coordinates);
  const nashCoords = nashPoints.map(np => np.coordinates);

  // Calculate bounds with padding
  const phiValues = coords.map(c => c.phi);
  const psiValues = coords.map(c => c.psi);
  const phiMin = Math.min(...phiValues) * 1.1;
  const phiMax = Math.max(...phiValues) * 1.1;
  const psiMin = Math.min(...psiValues) * 1.1;
  const psiMax = Math.max(...psiValues) * 1.1;

  // Scale functions
  const scaleX = (phi: number) =>
    ((phi - phiMin) / (phiMax - phiMin)) * (resolution - 100) + 50;
  const scaleY = (psi: number) =>
    resolution - 50 - ((psi - psiMin) / (psiMax - psiMin)) * (resolution - 100);

  // Color mapping based on n value
  const colors = COLOR_SCHEMES[colorScheme];
  const getColor = (n: number, maxN: number) => {
    const index = Math.floor((n / maxN) * (colors.length - 1));
    return colors[Math.min(index, colors.length - 1)];
  };

  const maxN = Math.max(...coords.map(c => c.n));

  // Generate SVG
  let svg = `<svg width="${resolution}" height="${resolution}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="${resolution}" height="${resolution}" fill="#0a0a0a"/>`;

  // Grid
  svg += '<g id="grid" opacity="0.2">';
  for (let i = 0; i <= 10; i++) {
    const x = 50 + i * (resolution - 100) / 10;
    const y = 50 + i * (resolution - 100) / 10;
    svg += `<line x1="${x}" y1="50" x2="${x}" y2="${resolution - 50}" stroke="#ffffff" stroke-width="0.5"/>`;
    svg += `<line x1="50" y1="${y}" x2="${resolution - 50}" y2="${y}" stroke="#ffffff" stroke-width="0.5"/>`;
  }
  svg += '</g>';

  // Axes
  svg += `<line x1="50" y1="${scaleY(0)}" x2="${resolution - 50}" y2="${scaleY(0)}" stroke="#ffffff" stroke-width="2"/>`;
  svg += `<line x1="${scaleX(0)}" y1="50" x2="${scaleX(0)}" y2="${resolution - 50}" stroke="#ffffff" stroke-width="2"/>`;

  // Trajectory path
  svg += '<path d="';
  coords.forEach((coord, i) => {
    const x = scaleX(coord.phi);
    const y = scaleY(coord.psi);
    svg += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  svg += `" fill="none" stroke="url(#gradient)" stroke-width="2" opacity="0.8"/>`;

  // Gradient for trajectory
  svg += '<defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">';
  colors.forEach((color, i) => {
    const offset = (i / (colors.length - 1)) * 100;
    svg += `<stop offset="${offset}%" stop-color="${color}"/>`;
  });
  svg += '</linearGradient></defs>';

  // Trajectory points
  coords.forEach((coord, i) => {
    if (i % 5 === 0) { // Sample points to avoid clutter
      const x = scaleX(coord.phi);
      const y = scaleY(coord.psi);
      const color = getColor(coord.n, maxN);
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.6"/>`;
    }
  });

  // Nash points (highlighted)
  if (highlightNashPoints && nashCoords.length > 0) {
    nashCoords.forEach(coord => {
      const x = scaleX(coord.phi);
      const y = scaleY(coord.psi);

      // Outer glow
      svg += `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#ff0000" stroke-width="2" opacity="0.3"/>`;
      svg += `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#ff0000" stroke-width="2" opacity="0.5"/>`;

      // Core point
      svg += `<circle cx="${x}" cy="${y}" r="5" fill="#ff0000" opacity="0.9"/>`;
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" opacity="1.0"/>`;
    });
  }

  // Start point
  const start = coords[0];
  svg += `<circle cx="${scaleX(start.phi)}" cy="${scaleY(start.psi)}" r="6" fill="#00ff00" stroke="#ffffff" stroke-width="2"/>`;

  // End point
  const end = coords[coords.length - 1];
  svg += `<circle cx="${scaleX(end.phi)}" cy="${scaleY(end.psi)}" r="6" fill="#0000ff" stroke="#ffffff" stroke-width="2"/>`;

  // Labels
  svg += `<text x="50" y="30" fill="#ffffff" font-size="14" font-family="Arial">Phase Space: φ vs ψ</text>`;
  svg += `<text x="${resolution / 2}" y="${resolution - 20}" fill="#ffffff" font-size="12" text-anchor="middle">φ(n)</text>`;
  svg += `<text x="20" y="${resolution / 2}" fill="#ffffff" font-size="12" text-anchor="middle" transform="rotate(-90, 20, ${resolution / 2})">ψ(n)</text>`;

  // Legend
  svg += `<circle cx="${resolution - 100}" cy="70" r="4" fill="#00ff00" stroke="#ffffff" stroke-width="1"/>`;
  svg += `<text x="${resolution - 90}" y="74" fill="#ffffff" font-size="10">Start (n=${start.n})</text>`;
  svg += `<circle cx="${resolution - 100}" cy="90" r="4" fill="#0000ff" stroke="#ffffff" stroke-width="1"/>`;
  svg += `<text x="${resolution - 90}" y="94" fill="#ffffff" font-size="10">End (n=${end.n})</text>`;

  if (highlightNashPoints && nashCoords.length > 0) {
    svg += `<circle cx="${resolution - 100}" cy="110" r="4" fill="#ff0000"/>`;
    svg += `<text x="${resolution - 90}" y="114" fill="#ffffff" font-size="10">Nash Points (${nashCoords.length})</text>`;
  }

  svg += '</svg>';

  return svg;
}

/**
 * Generate phase portrait with vector field
 */
export function generatePhasePortraitSVG(
  trajectory: TrajectoryPoint[],
  config: Partial<PhasePortraitConfig> = {}
): string {
  const defaultConfig: PhasePortraitConfig = {
    nMin: 1,
    nMax: 100,
    step: 1,
    colorScheme: 'plasma',
    highlightNashPoints: true,
    showVectorField: true,
    resolution: 800
  };

  const finalConfig = { ...defaultConfig, ...config };
  const { resolution, colorScheme, showVectorField } = finalConfig;

  const coords = trajectory.map(t => t.coordinates);
  const velocities = trajectory.map(t => t.velocity);

  // Calculate bounds
  const phiValues = coords.map(c => c.phi);
  const psiValues = coords.map(c => c.psi);
  const phiMin = Math.min(...phiValues) * 1.1;
  const phiMax = Math.max(...phiValues) * 1.1;
  const psiMin = Math.min(...psiValues) * 1.1;
  const psiMax = Math.max(...psiValues) * 1.1;

  const scaleX = (phi: number) =>
    ((phi - phiMin) / (phiMax - phiMin)) * (resolution - 100) + 50;
  const scaleY = (psi: number) =>
    resolution - 50 - ((psi - psiMin) / (psiMax - psiMin)) * (resolution - 100);

  let svg = `<svg width="${resolution}" height="${resolution}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${resolution}" height="${resolution}" fill="#0a0a0a"/>`;

  // Vector field
  if (showVectorField) {
    const gridSize = 20;
    const arrowScale = 20;

    svg += '<g id="vector-field" opacity="0.3">';

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const phi = phiMin + (i / gridSize) * (phiMax - phiMin);
        const psi = psiMin + (j / gridSize) * (psiMax - psiMin);

        // Find nearest trajectory point for velocity
        let minDist = Infinity;
        let nearestVel = { phi: 0, psi: 0 };

        for (let k = 0; k < coords.length; k++) {
          const dist = Math.sqrt(
            (coords[k].phi - phi) ** 2 + (coords[k].psi - psi) ** 2
          );
          if (dist < minDist) {
            minDist = dist;
            nearestVel = velocities[k];
          }
        }

        const x = scaleX(phi);
        const y = scaleY(psi);
        const velMag = Math.sqrt(nearestVel.phi ** 2 + nearestVel.psi ** 2);

        if (velMag > 0.01) {
          const dx = (nearestVel.phi / velMag) * arrowScale;
          const dy = -(nearestVel.psi / velMag) * arrowScale;

          svg += `<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="#00ffff" stroke-width="1"/>`;
          // Arrow head
          const angle = Math.atan2(dy, dx);
          const arrowSize = 4;
          const x2 = x + dx;
          const y2 = y + dy;
          svg += `<polygon points="${x2},${y2} ${x2 - arrowSize * Math.cos(angle - Math.PI / 6)},${y2 - arrowSize * Math.sin(angle - Math.PI / 6)} ${x2 - arrowSize * Math.cos(angle + Math.PI / 6)},${y2 - arrowSize * Math.sin(angle + Math.PI / 6)}" fill="#00ffff"/>`;
        }
      }
    }

    svg += '</g>';
  }

  // Trajectory
  const colors = COLOR_SCHEMES[colorScheme];
  svg += '<path d="';
  coords.forEach((coord, i) => {
    const x = scaleX(coord.phi);
    const y = scaleY(coord.psi);
    svg += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  svg += `" fill="none" stroke="${colors[Math.floor(colors.length / 2)]}" stroke-width="3" opacity="0.9"/>`;

  // Axes and labels
  svg += `<line x1="50" y1="${scaleY(0)}" x2="${resolution - 50}" y2="${scaleY(0)}" stroke="#ffffff" stroke-width="2"/>`;
  svg += `<line x1="${scaleX(0)}" y1="50" x2="${scaleX(0)}" y2="${resolution - 50}" stroke="#ffffff" stroke-width="2"/>`;
  svg += `<text x="50" y="30" fill="#ffffff" font-size="14" font-family="Arial">Phase Portrait with Vector Field</text>`;

  svg += '</svg>';

  return svg;
}

/**
 * Generate 3D phase space visualization data (φ, ψ, n)
 */
export function generate3DVisualizationData(
  trajectory: TrajectoryPoint[]
): { vertices: [number, number, number][], colors: string[] } {
  const coords = trajectory.map(t => t.coordinates);
  const maxN = Math.max(...coords.map(c => c.n));

  const vertices: [number, number, number][] = coords.map(c => [
    c.phi,
    c.psi,
    c.n / maxN // Normalize n to [0, 1]
  ]);

  const colors = coords.map(c => {
    const hue = (c.theta + Math.PI) / (2 * Math.PI) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  });

  return { vertices, colors };
}

/**
 * Export visualization data for external tools (D3.js, Three.js, etc.)
 */
export function exportVisualizationData(
  trajectory: TrajectoryPoint[],
  nashPoints: NashPoint[]
): VisualizationData {
  const coords = trajectory.map(t => t.coordinates);
  const nashCoords = nashPoints.map(np => np.coordinates);

  const path: [number, number][] = coords.map(c => [c.phi, c.psi]);

  const colors = coords.map(c => {
    const hue = (c.theta + Math.PI) / (2 * Math.PI) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  });

  const phiValues = coords.map(c => c.phi);
  const psiValues = coords.map(c => c.psi);

  return {
    points: coords,
    nashPoints: nashCoords,
    trajectory: { path, colors },
    bounds: {
      phiMin: Math.min(...phiValues),
      phiMax: Math.max(...phiValues),
      psiMin: Math.min(...psiValues),
      psiMax: Math.max(...psiValues)
    }
  };
}

/**
 * Generate HTML file with interactive D3.js visualization
 */
export function generateInteractiveHTML(
  trajectory: TrajectoryPoint[],
  nashPoints: NashPoint[],
  config: Partial<PhasePortraitConfig> = {}
): string {
  const data = exportVisualizationData(trajectory, nashPoints);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phase Space Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #0a0a0a;
      color: #ffffff;
      font-family: Arial, sans-serif;
    }
    #chart {
      margin: 20px auto;
      display: block;
    }
    .tooltip {
      position: absolute;
      padding: 8px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #ffffff;
      border-radius: 4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .controls {
      text-align: center;
      margin-bottom: 20px;
    }
    button {
      margin: 0 5px;
      padding: 10px 20px;
      background: #333;
      color: #fff;
      border: 1px solid #666;
      cursor: pointer;
      border-radius: 4px;
    }
    button:hover {
      background: #555;
    }
  </style>
</head>
<body>
  <h1 style="text-align: center;">Phase Space: φ(n) vs ψ(n)</h1>
  <div class="controls">
    <button onclick="resetZoom()">Reset Zoom</button>
    <button onclick="toggleNashPoints()">Toggle Nash Points</button>
    <button onclick="toggleVectorField()">Toggle Vector Field</button>
  </div>
  <svg id="chart"></svg>
  <div class="tooltip"></div>

  <script>
    const data = ${JSON.stringify(data)};
    const width = 900;
    const height = 700;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    let showNashPoints = true;
    let showVectorField = false;

    const svg = d3.select('#chart')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', \`translate(\${margin.left},\${margin.top})\`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain([data.bounds.phiMin, data.bounds.phiMax])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([data.bounds.psiMin, data.bounds.psiMax])
      .range([innerHeight, 0]);

    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Axes
    g.append('g')
      .attr('transform', \`translate(0,\${innerHeight})\`)
      .call(d3.axisBottom(xScale))
      .attr('color', '#ffffff');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .attr('color', '#ffffff');

    // Trajectory line
    const line = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    g.append('path')
      .datum(data.trajectory.path)
      .attr('fill', 'none')
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Trajectory points
    g.selectAll('.point')
      .data(data.points)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.phi))
      .attr('cy', d => yScale(d.psi))
      .attr('r', 3)
      .attr('fill', d => {
        const hue = (d.theta + Math.PI) / (2 * Math.PI) * 360;
        return \`hsl(\${hue}, 100%, 50%)\`;
      })
      .attr('opacity', 0.6)
      .on('mouseover', function(event, d) {
        d3.select('.tooltip')
          .style('opacity', 1)
          .html(\`n = \${d.n.toFixed(2)}<br/>φ = \${d.phi.toFixed(4)}<br/>ψ = \${d.psi.toFixed(4)}<br/>θ = \${d.theta.toFixed(4)}\`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select('.tooltip').style('opacity', 0);
      });

    // Nash points
    const nashGroup = g.append('g').attr('class', 'nash-points');

    nashGroup.selectAll('.nash')
      .data(data.nashPoints)
      .enter()
      .append('circle')
      .attr('class', 'nash')
      .attr('cx', d => xScale(d.phi))
      .attr('cy', d => yScale(d.psi))
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', '#ff0000')
      .attr('stroke-width', 2);

    // Functions
    function resetZoom() {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    }

    function toggleNashPoints() {
      showNashPoints = !showNashPoints;
      nashGroup.style('display', showNashPoints ? 'block' : 'none');
    }

    function toggleVectorField() {
      showVectorField = !showVectorField;
      // Vector field implementation would go here
    }
  </script>
</body>
</html>`;
}
