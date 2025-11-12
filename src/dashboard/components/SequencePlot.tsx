/**
 * Sequence Plot Component - Fibonacci and Lucas Sequences
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SequenceData } from '../types';

interface SequencePlotProps {
  data: SequenceData[];
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const SequencePlot: React.FC<SequencePlotProps> = ({
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

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
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

    const maxY = Math.max(
      d3.max(data, d => d.fibonacci) || 0,
      d3.max(data, d => d.lucas) || 0
    );

    const yScale = d3
      .scaleLog()
      .domain([1, maxY])
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(5, '.0s');

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('n');

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('Value (log scale)');

    // Line generators
    const fibonacciLine = d3
      .line<SequenceData>()
      .x(d => xScale(d.n))
      .y(d => yScale(Math.max(1, d.fibonacci)))
      .curve(d3.curveMonotoneX);

    const lucasLine = d3
      .line<SequenceData>()
      .x(d => xScale(d.n))
      .y(d => yScale(Math.max(1, d.lucas)))
      .curve(d3.curveMonotoneX);

    // Draw lines
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', fibonacciLine)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', lucasLine)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${innerWidth - 100}, 10)`);

    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 35)
      .attr('y', 4)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .text('F(n)');

    legend
      .append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 20)
      .attr('y2', 20)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2);

    legend
      .append('text')
      .attr('x', 35)
      .attr('y', 24)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .text('L(n)');

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

  }, [data, width, height, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Sequence Evolution: F(n) and L(n)
      </h2>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};
