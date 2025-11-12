/**
 * Divergence Plot Component - S(n) with Nash Points
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DivergenceData } from '../types';

interface DivergencePlotProps {
  data: DivergenceData[];
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  onNashPointClick?: (point: DivergenceData) => void;
}

export const DivergencePlot: React.FC<DivergencePlotProps> = ({
  data,
  width = 600,
  height = 400,
  theme = 'light',
  onNashPointClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

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
      .domain([0, d3.max(data, d => d.n) || 0])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 1])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('n');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('Divergence S(n)');

    // Threshold line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0.01))
      .attr('y2', yScale(0.01))
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(0.01) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#10b981')
      .attr('font-size', '12px')
      .text('ε = 0.01');

    // Line
    const line = d3
      .line<DivergenceData>()
      .x(d => xScale(d.n))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Animate line drawing
    const pathLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(1500)
      .attr('stroke-dashoffset', 0);

    // Nash points
    const nashPoints = data.filter(d => d.isNashPoint);

    g.selectAll('.nash-point')
      .data(nashPoints)
      .join('circle')
      .attr('class', 'nash-point')
      .attr('cx', d => xScale(d.n))
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .transition()
      .delay(1500)
      .duration(500)
      .attr('r', 6);

    // Nash point interactions
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', theme === 'dark' ? '#1f2937' : 'white')
      .style('color', theme === 'dark' ? 'white' : 'black')
      .style('padding', '12px')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.2)')
      .style('font-size', '14px');

    g.selectAll('.nash-point')
      .on('click', function(event, d: DivergenceData) {
        setSelectedPoint(d.n);
        if (onNashPointClick) {
          onNashPointClick(d);
        }
      })
      .on('mouseover', function(event, d: DivergenceData) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8);

        tooltip
          .style('opacity', 1)
          .html(`
            <strong>Nash Equilibrium Point</strong><br/>
            n = ${d.n}<br/>
            S(n) = ${d.value.toFixed(6)}<br/>
            Payoff = ${d.nashPayoff?.toFixed(2) || 'N/A'}
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 15}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.n === selectedPoint ? 8 : 6);
        tooltip.style('opacity', 0);
      });

    // Highlight selected point
    if (selectedPoint !== null) {
      g.selectAll('.nash-point')
        .filter((d: any) => d.n === selectedPoint)
        .attr('r', 8)
        .attr('fill', '#f59e0b');
    }

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

    // Stats
    const nashCount = nashPoints.length;
    const avgDivergence = d3.mean(data, d => d.value) || 0;

    g.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '12px')
      .text(`Nash Points: ${nashCount} | Avg S(n): ${avgDivergence.toFixed(4)}`);

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, theme, selectedPoint, onNashPointClick]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Divergence S(n) with Nash Equilibrium Points
      </h2>
      <svg ref={svgRef} width={width} height={height} />
      {selectedPoint !== null && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Selected Nash Point:</strong> n = {selectedPoint}
          </p>
        </div>
      )}
    </div>
  );
};
