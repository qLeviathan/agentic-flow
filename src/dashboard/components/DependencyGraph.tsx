/**
 * Dependency Graph Component - Interactive Exploration
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DependencyGraphData, DependencyNode } from '../types';

interface DependencyGraphProps {
  data: DependencyGraphData;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  data,
  width = 800,
  height = 600,
  theme = 'light',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Type-based colors
    const colorMap: Record<string, string> = {
      sequence: '#3b82f6',
      transform: '#8b5cf6',
      metric: '#10b981',
      operator: '#f59e0b',
    };

    // Create force simulation
    type SimulationNode = DependencyNode & d3.SimulationNodeDatum;
    type SimulationLink = d3.SimulationLinkDatum<SimulationNode>;

    const nodes: SimulationNode[] = data.nodes.map(d => ({ ...d }));
    const links: SimulationLink[] = data.edges.map(e => ({
      source: e.source,
      target: e.target,
    }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id(d => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', theme === 'dark' ? '#6b7280' : '#d1d5db')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', theme === 'dark' ? '#6b7280' : '#d1d5db');

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node
      .append('circle')
      .attr('r', 20)
      .attr('fill', d => colorMap[d.type])
      .attr('stroke', theme === 'dark' ? '#fff' : '#000')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseover', function() {
        d3.select(this).attr('r', 24).attr('stroke-width', 3);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 20).attr('stroke-width', 2);
      });

    // Node labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.label);

    // Tooltip
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
      .style('max-width', '300px');

    node
      .on('mouseenter', function(event, d) {
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.label}</strong><br/>
            <span style="color: ${colorMap[d.type]};">Type: ${d.type}</span><br/>
            ${d.formula ? `Formula: <code>${d.formula}</code><br/>` : ''}
            Dependencies: ${d.dependencies.length > 0 ? d.dependencies.join(', ') : 'None'}
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.pageX + 15}px`)
          .style('top', `${event.pageY - 15}px`);
      })
      .on('mouseleave', function() {
        tooltip.style('opacity', 0);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimulationNode).x || 0)
        .attr('y1', d => (d.source as SimulationNode).y || 0)
        .attr('x2', d => (d.target as SimulationNode).x || 0)
        .attr('y2', d => (d.target as SimulationNode).y || 0);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Legend
    const legend = g.append('g').attr('transform', 'translate(10, 10)');

    Object.entries(colorMap).forEach(([type, color], i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow
        .append('circle')
        .attr('r', 8)
        .attr('fill', color)
        .attr('stroke', theme === 'dark' ? '#fff' : '#000')
        .attr('stroke-width', 1);

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 5)
        .attr('fill', theme === 'dark' ? '#fff' : '#000')
        .attr('font-size', '12px')
        .text(type);
    });

    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [data, width, height, theme]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
        Mathematical Framework Dependency Graph
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Click nodes to explore, drag to rearrange
      </p>
      <svg ref={svgRef} width={width} height={height} />
      {selectedNode && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {selectedNode.label}
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <strong className="ml-2">{selectedNode.type}</strong>
            </p>
            {selectedNode.formula && (
              <p>
                <span className="text-gray-600 dark:text-gray-400">Formula:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {selectedNode.formula}
                </code>
              </p>
            )}
            <p>
              <span className="text-gray-600 dark:text-gray-400">Dependencies:</span>
              <strong className="ml-2">
                {selectedNode.dependencies.length > 0
                  ? selectedNode.dependencies.join(', ')
                  : 'None (base sequence)'}
              </strong>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {selectedNode.type === 'sequence' &&
                'Base sequences that generate all derived values'}
              {selectedNode.type === 'transform' &&
                'Mathematical transformations of base sequences'}
              {selectedNode.type === 'metric' &&
                'Computed metrics for analysis and Nash equilibria'}
              {selectedNode.type === 'operator' &&
                'High-level operators combining multiple components'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
