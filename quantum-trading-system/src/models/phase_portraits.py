"""
Phase Portrait Visualization
=============================

Generates phase space visualizations for Xi/Psi dynamics model.
Uses matplotlib with integer-only arithmetic for all calculations.

Author: Agent 10 (Zeckendorf: 10010)
Dependencies: xi_psi.py
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from typing import List, Tuple, Optional
import os

try:
    from .xi_psi import XiPsiModel, PhasePortrait, PhaseState, SCALE
except ImportError:
    from xi_psi import XiPsiModel, PhasePortrait, PhaseState, SCALE


class PhasePortraitVisualizer:
    """
    Creates phase space visualizations (xi, psi) plots.
    """

    def __init__(self, scale: int = SCALE):
        self.scale = scale

    def plot_trajectory(
        self,
        portrait: PhasePortrait,
        figsize: Tuple[int, int] = (12, 10),
        save_path: Optional[str] = None
    ) -> Figure:
        """
        Plot phase space trajectory with color-coded coherence.

        Args:
            portrait: PhasePortrait object
            figsize: Figure size in inches
            save_path: Optional path to save figure

        Returns:
            Matplotlib Figure object
        """
        fig, axes = plt.subplots(2, 2, figsize=figsize)
        fig.suptitle('Xi/Psi Phase Space Dynamics', fontsize=16, fontweight='bold')

        # Extract data (convert to float for plotting only)
        xi_values = np.array([p.xi / self.scale for p in portrait.points])
        psi_values = np.array([p.psi / self.scale for p in portrait.points])
        coherence = np.array([p.coherence / self.scale for p in portrait.points])
        times = np.array(portrait.lucas_times[:len(portrait.points)])

        # 1. Phase space trajectory (xi vs psi)
        ax1 = axes[0, 0]
        scatter = ax1.scatter(
            xi_values,
            psi_values,
            c=coherence,
            cmap='viridis',
            s=100,
            alpha=0.7,
            edgecolors='black',
            linewidth=0.5
        )

        # Plot trajectory line
        if len(portrait.trajectories) > 0:
            traj = portrait.trajectories[0]
            traj_xi = [p[0] / self.scale for p in traj]
            traj_psi = [p[1] / self.scale for p in traj]
            ax1.plot(traj_xi, traj_psi, 'k--', alpha=0.3, linewidth=1)

        # Mark attractors
        if portrait.attractors:
            attr_xi = [a[0] / self.scale for a in portrait.attractors]
            attr_psi = [a[1] / self.scale for a in portrait.attractors]
            ax1.scatter(
                attr_xi,
                attr_psi,
                marker='*',
                s=500,
                c='red',
                edgecolors='black',
                linewidth=2,
                label='Attractors',
                zorder=10
            )

        ax1.set_xlabel('Xi (ξ) - Position', fontsize=12)
        ax1.set_ylabel('Psi (ψ) - Momentum', fontsize=12)
        ax1.set_title('Phase Space Trajectory', fontsize=13, fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.legend()

        cbar1 = plt.colorbar(scatter, ax=ax1)
        cbar1.set_label('Coherence', fontsize=10)

        # 2. Time evolution of position (xi)
        ax2 = axes[0, 1]
        ax2.plot(times, xi_values, 'b-', linewidth=2, label='Xi (Position)')
        ax2.fill_between(times, xi_values, alpha=0.3)
        ax2.set_xlabel('Lucas Time', fontsize=12)
        ax2.set_ylabel('Xi (ξ)', fontsize=12)
        ax2.set_title('Position Evolution', fontsize=13, fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.legend()

        # 3. Time evolution of momentum (psi)
        ax3 = axes[1, 0]
        ax3.plot(times, psi_values, 'r-', linewidth=2, label='Psi (Momentum)')
        ax3.axhline(y=0, color='k', linestyle='--', alpha=0.5)
        ax3.fill_between(times, psi_values, alpha=0.3, color='red')
        ax3.set_xlabel('Lucas Time', fontsize=12)
        ax3.set_ylabel('Psi (ψ)', fontsize=12)
        ax3.set_title('Momentum Evolution', fontsize=13, fontweight='bold')
        ax3.grid(True, alpha=0.3)
        ax3.legend()

        # 4. Coherence evolution
        ax4 = axes[1, 1]
        ax4.plot(times, coherence, 'g-', linewidth=2, label='Coherence')
        ax4.axhline(y=0.8, color='orange', linestyle='--', alpha=0.7, label='Threshold (0.8)')
        ax4.fill_between(times, coherence, alpha=0.3, color='green')
        ax4.set_xlabel('Lucas Time', fontsize=12)
        ax4.set_ylabel('Coherence', fontsize=12)
        ax4.set_title('Quantum Coherence', fontsize=13, fontweight='bold')
        ax4.set_ylim([0, 1.1])
        ax4.grid(True, alpha=0.3)
        ax4.legend()

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Phase portrait saved to: {save_path}")

        return fig

    def plot_coherence_map(
        self,
        portrait: PhasePortrait,
        figsize: Tuple[int, int] = (10, 8),
        save_path: Optional[str] = None
    ) -> Figure:
        """
        Plot 2D coherence heatmap in phase space.

        Args:
            portrait: PhasePortrait object
            figsize: Figure size in inches
            save_path: Optional path to save figure

        Returns:
            Matplotlib Figure object
        """
        fig, ax = plt.subplots(figsize=figsize)

        # Coherence map (convert to float for plotting)
        coherence_map = portrait.coherence_map.astype(float) / self.scale

        # Plot heatmap
        im = ax.imshow(
            coherence_map.T,
            origin='lower',
            cmap='hot',
            interpolation='bilinear',
            aspect='auto',
            vmin=0,
            vmax=1
        )

        # Overlay trajectory points
        if portrait.points:
            xi_values = np.array([p.xi for p in portrait.points])
            psi_values = np.array([p.psi for p in portrait.points])

            # Normalize to grid coordinates
            xi_min, xi_max = xi_values.min(), xi_values.max()
            psi_min, psi_max = psi_values.min(), psi_values.max()

            grid_size = coherence_map.shape[0]

            if xi_max > xi_min:
                xi_norm = ((xi_values - xi_min) * (grid_size - 1)) / (xi_max - xi_min)
            else:
                xi_norm = np.full_like(xi_values, grid_size // 2, dtype=float)

            if psi_max > psi_min:
                psi_norm = ((psi_values - psi_min) * (grid_size - 1)) / (psi_max - psi_min)
            else:
                psi_norm = np.full_like(psi_values, grid_size // 2, dtype=float)

            ax.scatter(
                xi_norm,
                psi_norm,
                c='cyan',
                s=30,
                alpha=0.6,
                edgecolors='white',
                linewidth=0.5
            )

        ax.set_xlabel('Xi (ξ) - Position [Grid Index]', fontsize=12)
        ax.set_ylabel('Psi (ψ) - Momentum [Grid Index]', fontsize=12)
        ax.set_title('Phase Space Coherence Map', fontsize=14, fontweight='bold')

        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Coherence', fontsize=11)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Coherence map saved to: {save_path}")

        return fig

    def plot_state_distribution(
        self,
        portrait: PhasePortrait,
        figsize: Tuple[int, int] = (10, 6),
        save_path: Optional[str] = None
    ) -> Figure:
        """
        Plot distribution of phase states over time.

        Args:
            portrait: PhasePortrait object
            figsize: Figure size in inches
            save_path: Optional path to save figure

        Returns:
            Matplotlib Figure object
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)

        # Count states
        state_counts = {
            'Bullish': sum(1 for p in portrait.points if p.state == PhaseState.BULLISH),
            'Bearish': sum(1 for p in portrait.points if p.state == PhaseState.BEARISH),
            'Ranging': sum(1 for p in portrait.points if p.state == PhaseState.RANGING),
            'Transitional': sum(1 for p in portrait.points if p.state == PhaseState.TRANSITIONAL)
        }

        # Pie chart
        colors = ['green', 'red', 'blue', 'orange']
        ax1.pie(
            state_counts.values(),
            labels=state_counts.keys(),
            autopct='%1.1f%%',
            colors=colors,
            startangle=90
        )
        ax1.set_title('Phase State Distribution', fontsize=13, fontweight='bold')

        # Time series of states
        times = np.array(portrait.lucas_times[:len(portrait.points)])
        state_numeric = []
        state_map = {
            PhaseState.BULLISH: 1,
            PhaseState.RANGING: 0,
            PhaseState.BEARISH: -1,
            PhaseState.TRANSITIONAL: 0.5
        }

        for p in portrait.points:
            state_numeric.append(state_map.get(p.state, 0))

        ax2.plot(times, state_numeric, 'ko-', linewidth=2, markersize=6)
        ax2.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
        ax2.fill_between(times, state_numeric, alpha=0.3)
        ax2.set_xlabel('Lucas Time', fontsize=12)
        ax2.set_ylabel('State Value', fontsize=12)
        ax2.set_title('State Evolution Over Time', fontsize=13, fontweight='bold')
        ax2.set_yticks([-1, -0.5, 0, 0.5, 1])
        ax2.set_yticklabels(['Bearish', '', 'Ranging', 'Trans.', 'Bullish'])
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"State distribution saved to: {save_path}")

        return fig


def generate_sample_portraits(
    prices: List[int],
    output_dir: str = '/home/user/agentic-flow/quantum-trading-system/docs',
    scale: int = SCALE
) -> None:
    """
    Generate complete set of phase portraits for given price series.

    Args:
        prices: Price series (scaled integers)
        output_dir: Directory to save plots
        scale: Scaling factor
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Create model and evolve
    model = XiPsiModel(scale=scale)
    portrait = model.evolve_phase_space(prices, num_steps=len(prices))

    # Create visualizer
    viz = PhasePortraitVisualizer(scale=scale)

    # Generate plots
    print("Generating phase portraits...")

    viz.plot_trajectory(
        portrait,
        save_path=os.path.join(output_dir, 'phase_trajectory.png')
    )
    plt.close()

    viz.plot_coherence_map(
        portrait,
        save_path=os.path.join(output_dir, 'coherence_map.png')
    )
    plt.close()

    viz.plot_state_distribution(
        portrait,
        save_path=os.path.join(output_dir, 'state_distribution.png')
    )
    plt.close()

    print(f"All phase portraits saved to: {output_dir}")


# Example usage
if __name__ == '__main__':
    # Generate sample price data (scaled integers)
    # Simulated price movement: $100 base with trend + noise
    np.random.seed(42)
    base_price = 100 * SCALE
    trend = np.linspace(0, 20 * SCALE, 50)
    noise = np.random.randint(-5 * SCALE, 5 * SCALE, 50)
    sample_prices = (base_price + trend + noise).astype(int).tolist()

    # Generate portraits
    generate_sample_portraits(
        sample_prices,
        output_dir='/home/user/agentic-flow/quantum-trading-system/docs'
    )

    print("\nPhase portrait generation complete!")
    print("Files created:")
    print("  - phase_trajectory.png")
    print("  - coherence_map.png")
    print("  - state_distribution.png")
