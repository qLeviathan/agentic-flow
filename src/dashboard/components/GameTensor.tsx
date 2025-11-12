/**
 * Game Tensor Component - Game Theory Payoff Matrix
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GameTensorData } from '../types';

interface GameTensorProps {
  data: GameTensorData;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const GameTensor: React.FC<GameTensorProps> = ({
  data,
  width = 600,
  height = 400,
  theme = 'light',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.payoffs.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 20, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const n = data.strategies.length;
    const cellWidth = innerWidth / n;
    const cellHeight = innerHeight / n;

    // Color scale
    const maxPayoff = d3.max(data.payoffs.flat()) || 1;
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, maxPayoff]);

    // Draw cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const isNash = data.nashEquilibria.some(
          ([ni, nj]) => ni === i && nj === j
        );

        const cell = g
          .append('rect')
          .attr('x', j * cellWidth)
          .attr('y', i * cellHeight)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', colorScale(data.payoffs[i][j]))
          .attr('stroke', isNash ? '#10b981' : '#e5e7eb')
          .attr('stroke-width', isNash ? 4 : 1)
          .style('cursor', 'pointer')
          .attr('opacity', 0);

        cell
          .transition()
          .delay((i * n + j) * 50)
          .duration(500)
          .attr('opacity', 1);

        // Value text
        g.append('text')
          .attr('x', j * cellWidth + cellWidth / 2)
          .attr('y', i * cellHeight + cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', data.payoffs[i][j] > maxPayoff / 2 ? 'white' : 'black')
          .attr('font-size', '14px')
          .attr('font-weight', isNash ? 'bold' : 'normal')
          .text(data.payoffs[i][j].toFixed(2))
          .attr('opacity', 0)
          .transition()
          .delay((i * n + j) * 50 + 500)
          .duration(300)
          .attr('opacity', 1);

        // Nash star
        if (isNash) {
          g.append('text')
            .attr('x', j * cellWidth + cellWidth - 8)
            .attr('y', i * cellHeight + 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#10b981')
            .attr('font-size', '16px')
            .text('★')
            .attr('opacity', 0)
            .transition()
            .delay((i * n + j) * 50 + 800)
            .duration(300)
            .attr('opacity', 1);
        }

        // Tooltip
        const tooltip = d3
          .select('body')
          .append('div')
          .style('position', 'absolute')
          .style('background', theme === 'dark' ? '#1f2937' : 'white')
          .style('color', theme === 'dark' ? 'white' : 'black')
          .style('padding', '10px')
          .style('border-radius', '6px')
          .style('pointer-events', 'none')
          .style('opacity', 0)
          .style('box-shadow', '0 4px 12px rgba(0,0,0,0.2)');

        cell
          .on('mouseover', function(event) {
            d3.select(this).attr('opacity', 0.8);
            tooltip
              .style('opacity', 1)
              .html(`
                <strong>Strategy Pair</strong><br/>
                Player 1: ${data.strategies[i]}<br/>
                Player 2: ${data.strategies[j]}<br/>
                Payoff: ${data.payoffs[i][j].toFixed(2)}<br/>
                ${isNash ? '<span style="color: #10b981;">★ Nash Equilibrium</span>' : ''}
              `);
          })
          .on('mousemove', function(event) {
            tooltip
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY - 15}px`);
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            tooltip.style('opacity', 0);
          });
      }
    }

    // Row labels (Player 1)
    data.strategies.forEach((strategy, i) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', theme === 'dark' ? '#fff' : '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(strategy);
    });

    // Column labels (Player 2)
    data.strategies.forEach((strategy, j) => {
      g.append('text')
        .attr('x', j * cellWidth + cellWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', theme === 'dark' ? '#fff' : '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(strategy);
    });

    // Axis titles
    g.append('text')
      .attr('x', -40)
      .attr('y', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90, -40, ${innerHeight / 2})`)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Player 1');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Player 2');

    // Legend
    const legendWidth = 200;
    const legendHeight = 15;
    const legendScale = d3
      .scaleLinear()
      .domain([0, legendWidth])
      .range([0, maxPayoff]);

    const legend = g
      .append('g')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${innerHeight + 30})`);

    const legendData = d3.range(legendWidth);
    legend
      .selectAll('rect')
      .data(legendData)
      .join('rect')
      .attr('x', d => d)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', legendHeight)
      .attr('fill', d => colorScale(legendScale(d)));

    legend
      .append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '10px')
      .text('0');

    legend
      .append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '10px')
      .text(maxPayoff.toFixed(2));

  }, [data, width, height, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
        Game Theory Tensor: Payoff Matrix
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Nash Equilibria marked with ★ and green border
      </p>
      <svg ref={svgRef} width={width} height={height} />
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        <p>Nash Equilibria: {data.nashEquilibria.length} points</p>
        <p>
          Positions:{' '}
          {data.nashEquilibria
            .map(([i, j]) => `(${data.strategies[i]}, ${data.strategies[j]})`)
            .join(', ')}
        </p>
      </div>
    </div>
  );
};
