#!/usr/bin/env python
"""
Quantum Trading System - Setup Configuration
Integer-Only Algorithmic Trading Framework

Agent 32: Deployment Specialist
Date: 2024-11-25
"""

from setuptools import setup, find_packages
import os

# Read long description from README
def read_file(filename):
    """Read file contents"""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

# Version
VERSION = '1.0.0'

# Requirements
REQUIREMENTS = [
    # Core dependencies
    'requests>=2.31.0',
    'python-dateutil>=2.8.2',

    # Data processing
    'numpy>=1.24.0',
    'pandas>=2.0.0',

    # Visualization
    'plotly>=5.0.0',
    'kaleido>=0.2.0',

    # Testing
    'pytest>=7.4.0',
    'pytest-cov>=4.1.0',
    'pytest-mock>=3.11.1',
    'pytest-xdist>=3.3.0',

    # Development
    'black>=23.0.0',
    'flake8>=6.0.0',
    'mypy>=1.5.0',

    # Documentation
    'sphinx>=7.0.0',
    'sphinx-rtd-theme>=1.3.0',

    # Jupyter
    'jupyter>=1.0.0',
    'jupyterlab>=4.0.0',
    'nbformat>=5.9.0',
    'ipywidgets>=8.1.0',
]

EXTRAS_REQUIRE = {
    'dev': [
        'black>=23.0.0',
        'flake8>=6.0.0',
        'mypy>=1.5.0',
        'pytest-xdist>=3.3.0',
        'ipython>=8.12.0',
    ],
    'docs': [
        'sphinx>=7.0.0',
        'sphinx-rtd-theme>=1.3.0',
        'sphinx-autodoc-typehints>=1.24.0',
    ],
    'ml': [
        'scikit-learn>=1.3.0',
        'tensorflow>=2.13.0',  # For advanced QFNN
    ],
    'all': [],  # Will be populated below
}

# Add all extras to 'all'
for extra_deps in EXTRAS_REQUIRE.values():
    EXTRAS_REQUIRE['all'].extend(extra_deps)
EXTRAS_REQUIRE['all'] = list(set(EXTRAS_REQUIRE['all']))

setup(
    # Basic metadata
    name='quantum-trading-system',
    version=VERSION,
    description='Integer-Only Algorithmic Trading Framework using Fibonacci and Lucas Sequences',
    long_description=read_file('docs/FINAL_DELIVERY_REPORT.md'),
    long_description_content_type='text/markdown',

    # Author
    author='Quantum Trading Team',
    author_email='info@quantum-trading.com',
    url='https://github.com/your-org/quantum-trading-system',

    # License
    license='Proprietary',

    # Classifiers
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Financial and Insurance Industry',
        'Topic :: Office/Business :: Financial :: Investment',
        'License :: Other/Proprietary License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Operating System :: OS Independent',
    ],

    # Python version
    python_requires='>=3.11',

    # Packages
    packages=find_packages(exclude=['tests', 'tests.*', 'docs', 'examples']),

    # Package data
    package_data={
        'src': ['py.typed'],  # For type checking
    },

    # Include additional files
    include_package_data=True,

    # Dependencies
    install_requires=REQUIREMENTS,
    extras_require=EXTRAS_REQUIRE,

    # Entry points
    entry_points={
        'console_scripts': [
            'quantum-trading=src.cli:main',  # Main CLI (if implemented)
            'quantum-backtest=src.backtesting.backtest_engine:cli',  # Backtest CLI
            'quantum-validate=src.encoders.integer_validator:cli',  # Validation CLI
        ],
    },

    # Additional metadata
    keywords=[
        'algorithmic trading',
        'integer arithmetic',
        'fibonacci',
        'lucas numbers',
        'backtesting',
        'quantitative finance',
        'trading strategies',
        'financial modeling',
    ],

    # Project URLs
    project_urls={
        'Documentation': 'https://quantum-trading-system.readthedocs.io/',
        'Source': 'https://github.com/your-org/quantum-trading-system',
        'Tracker': 'https://github.com/your-org/quantum-trading-system/issues',
    },

    # Zip safe
    zip_safe=False,
)
