"""
Mathematical Encoders for Quantum Trading System
================================================

OEIS-based encoders for price and time encoding:
- Fibonacci (A000045): Price levels and retracements
- Lucas (A000032): Time intervals and Nash equilibrium exits
- Zeckendorf (A003714): Bit addressing and compression

All encoders use integer-only arithmetic for quantum coherence.
"""

from .lucas_encoder import LucasEncoder
from .zeckendorf_compressor import ZeckendorfCompressor

__all__ = ['LucasEncoder', 'ZeckendorfCompressor']
__version__ = '1.0.0'
