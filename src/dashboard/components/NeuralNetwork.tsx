/**
 * Neural Network Component - Convergence Animation
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { NeuralNetworkData } from '../types';

interface NeuralNetworkProps {
  data: NeuralNetworkData;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  animate?: boolean;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  data,
  width = 800,
  height = 500,
  theme = 'light',
  animate = true,
}) => {
  const networkRef = useRef<SVGSVGElement>(null);
  const convergenceRef = useRef<SVGSVGElement>(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  // Animate convergence
  useEffect(() => {
    if (!animate) {
      setCurrentEpoch(data.currentEpoch);
      return;
    }

    let epoch = 0;
    const interval = setInterval(() => {
      if (epoch >= data.currentEpoch) {
        clearInterval(interval);
        return;
      }
      setCurrentEpoch(epoch);
      epoch += 1;
    }, 20);

    return () => clearInterval(interval);
  }, [data.currentEpoch, animate]);

  // Draw network architecture
  useEffect(() => {
    if (!networkRef.current) return;

    const svg = d3.select(networkRef.current);
    svg.selectAll('*').remove();

    const networkWidth = width * 0.5;
    const networkHeight = height;
    const margin = { top: 40, right: 20, bottom: 20, left: 20 };

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = networkWidth - margin.left - margin.right;
    const innerHeight = networkHeight - margin.top - margin.bottom;

    const layers = data.layers;
    const maxNeurons = Math.max(...layers.map(l => l.neurons));
    const layerSpacing = innerWidth / (layers.length - 1);

    // Calculate neuron positions
    interface NeuronPosition {
      layerId: string;
      layerIdx: number;
      neuronIdx: number;
      x: number;
      y: number;
      activation: string;
    }

    const neuronPositions: NeuronPosition[] = [];

    layers.forEach((layer, layerIdx) => {
      const neuronSpacing = innerHeight / (layer.neurons + 1);
      for (let i = 0; i < layer.neurons; i++) {
        neuronPositions.push({
          layerId: layer.id,
          layerIdx,
          neuronIdx: i,
          x: layerIdx * layerSpacing,
          y: (i + 1) * neuronSpacing,
          activation: layer.activation,
        });
      }
    });

    // Draw connections
    const connections: Array<{ source: NeuronPosition; target: NeuronPosition }> = [];
    for (let i = 0; i < layers.length - 1; i++) {
      const sourcLayer = neuronPositions.filter(n => n.layerIdx === i);
      const targetLayer = neuronPositions.filter(n => n.layerIdx === i + 1);

      sourcLayer.forEach(source => {
        targetLayer.forEach(target => {
          connections.push({ source, target });
        });
      });
    }

    // Weight strength based on convergence
    const convergenceProgress = currentEpoch / data.currentEpoch;

    g.selectAll('.connection')
      .data(connections)
      .join('line')
      .attr('class', 'connection')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', theme === 'dark' ? '#4b5563' : '#d1d5db')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3 * convergenceProgress);

    // Draw neurons
    const neurons = g
      .selectAll('.neuron')
      .data(neuronPositions)
      .join('circle')
      .attr('class', 'neuron')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 8)
      .attr('fill', d => {
        if (d.activation === 'relu') return '#3b82f6';
        if (d.activation === 'sigmoid') return '#8b5cf6';
        return '#10b981';
      })
      .attr('stroke', theme === 'dark' ? '#fff' : '#000')
      .attr('stroke-width', 1)
      .attr('opacity', 0);

    neurons
      .transition()
      .delay((d, i) => i * 30)
      .duration(500)
      .attr('opacity', 0.9);

    // Layer labels
    layers.forEach((layer, idx) => {
      g.append('text')
        .attr('x', idx * layerSpacing)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', theme === 'dark' ? '#fff' : '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`Layer ${idx + 1}`);

      g.append('text')
        .attr('x', idx * layerSpacing)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', theme === 'dark' ? '#9ca3af' : '#6b7280')
        .attr('font-size', '10px')
        .text(`${layer.neurons} (${layer.activation})`);
    });

  }, [data.layers, width, height, theme, currentEpoch, data.currentEpoch]);

  // Draw convergence plot
  useEffect(() => {
    if (!convergenceRef.current) return;

    const svg = d3.select(convergenceRef.current);
    svg.selectAll('*').remove();

    const plotWidth = width * 0.5;
    const plotHeight = height;
    const margin = { top: 40, right: 20, bottom: 50, left: 60 };

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = plotWidth - margin.left - margin.right;
    const innerHeight = plotHeight - margin.top - margin.bottom;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, data.currentEpoch])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.convergenceHistory) || 1])
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
      .text('Epoch');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .style('text-anchor', 'middle')
      .text('Loss');

    // Line
    const line = d3
      .line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const visibleData = data.convergenceHistory.slice(0, currentEpoch + 1);

    g.append('path')
      .datum(visibleData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Current epoch marker
    if (currentEpoch > 0 && currentEpoch < data.convergenceHistory.length) {
      g.append('circle')
        .attr('cx', xScale(currentEpoch))
        .attr('cy', yScale(data.convergenceHistory[currentEpoch]))
        .attr('r', 5)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', xScale(currentEpoch))
        .attr('y', yScale(data.convergenceHistory[currentEpoch]) - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', theme === 'dark' ? '#fff' : '#000')
        .attr('font-size', '11px')
        .text(`Loss: ${data.convergenceHistory[currentEpoch].toFixed(4)}`);
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

  }, [data, width, height, theme, currentEpoch]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Neural Network Convergence
      </h2>
      <div className="flex">
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Architecture
          </h3>
          <svg ref={networkRef} width={width * 0.5} height={height} />
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Training Progress
          </h3>
          <svg ref={convergenceRef} width={width * 0.5} height={height} />
        </div>
      </div>
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Epoch:</span>
            <strong className="ml-2 text-blue-900 dark:text-blue-100">
              {currentEpoch} / {data.currentEpoch}
            </strong>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Current Loss:</span>
            <strong className="ml-2 text-blue-900 dark:text-blue-100">
              {currentEpoch < data.convergenceHistory.length
                ? data.convergenceHistory[currentEpoch].toFixed(4)
                : 'N/A'}
            </strong>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Final Loss:</span>
            <strong className="ml-2 text-blue-900 dark:text-blue-100">
              {data.loss.toFixed(4)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
