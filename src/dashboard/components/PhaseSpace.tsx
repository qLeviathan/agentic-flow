/**
 * Phase Space Component - φ(n) vs ψ(n) Trajectory
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { PhaseSpacePoint } from '../types';

interface PhaseSpaceProps {
  data: PhaseSpacePoint[];
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const PhaseSpace: React.FC<PhaseSpaceProps> = ({
  data,
  width = 600,
  height = 400,
  theme = 'light',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([d3.min(data, d => d.phi) || 0, d3.max(data, d => d.phi) || 1])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, d => d.psi) || -1, d3.max(data, d => d.psi) || 0])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('φ(n)');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('ψ(n)');

    // Color scale for trajectory progression
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, data.length - 1]);

    // Draw trajectory
    const line = d3
      .line<PhaseSpacePoint>()
      .x(d => xScale(d.phi))
      .y(d => yScale(d.psi))
      .curve(d3.curveCatmullRom);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('stroke-dasharray', function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

    // Draw points
    const points = g
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => xScale(d.phi))
      .attr('cy', d => yScale(d.psi))
      .attr('r', 0)
      .attr('fill', (d, i) => colorScale(i))
      .attr('opacity', 0.7);

    points
      .transition()
      .delay((d, i) => i * 20)
      .duration(500)
      .attr('r', 4);

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', theme === 'dark' ? '#1f2937' : 'white')
      .style('color', theme === 'dark' ? 'white' : 'black')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)');

    points
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1);
        tooltip
          .style('opacity', 1)
          .html(`n = ${d.n}<br/>φ = ${d.phi.toFixed(4)}<br/>ψ = ${d.psi.toFixed(4)}`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4).attr('opacity', 0.7);
        tooltip.style('opacity', 0);
      });

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(8)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Phase Space Trajectory: φ(n) vs ψ(n)
      </h2>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};
