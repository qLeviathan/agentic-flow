"""
Data processing and validation package for quantum trading system.

This package contains data acquisition, validation, and processing modules
that ensure 100% integer-only operations throughout the trading pipeline.
"""

from .data_validator import DataValidator

__all__ = ['DataValidator']
