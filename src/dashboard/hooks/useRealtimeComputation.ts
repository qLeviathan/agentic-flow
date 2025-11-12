/**
 * Custom hook for real-time computation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateAll } from '../utils/calculations';
import type { ComputationParams } from '../types';

export function useRealtimeComputation(initialParams: ComputationParams) {
  const [params, setParams] = useState(initialParams);
  const [data, setData] = useState(() => calculateAll(initialParams.n));
  const [isComputing, setIsComputing] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const compute = useCallback((newN: number) => {
    setIsComputing(true);

    // Simulate async computation for large N
    if (newN > 100) {
      setTimeout(() => {
        const result = calculateAll(newN);
        setData(result);
        setIsComputing(false);
      }, 100);
    } else {
      const result = calculateAll(newN);
      setData(result);
      setIsComputing(false);
    }
  }, []);

  const updateN = useCallback((newN: number) => {
    setParams(prev => ({ ...prev, n: newN }));
    compute(newN);
  }, [compute]);

  const updateParams = useCallback((updates: Partial<ComputationParams>) => {
    setParams(prev => {
      const newParams = { ...prev, ...updates };
      if (updates.n !== undefined) {
        compute(updates.n);
      }
      return newParams;
    });
  }, [compute]);

  // Auto-update effect
  useEffect(() => {
    if (autoUpdate && params.n < params.maxIterations) {
      timeoutRef.current = setTimeout(() => {
        updateN(params.n + 1);
      }, 200);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoUpdate, params.n, params.maxIterations, updateN]);

  const toggleAutoUpdate = useCallback(() => {
    setAutoUpdate(prev => !prev);
  }, []);

  const reset = useCallback(() => {
    setAutoUpdate(false);
    updateN(initialParams.n);
  }, [initialParams.n, updateN]);

  return {
    params,
    data,
    isComputing,
    autoUpdate,
    updateN,
    updateParams,
    toggleAutoUpdate,
    reset,
  };
}
