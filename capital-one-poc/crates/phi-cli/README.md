# φ-AI CLI - Beautiful Terminal User Interface

A modern, feature-rich CLI with an interactive TUI built using Ratatui, Crossterm, and Tokio.

## Features

✨ **Dashboard View** - Real-time system status, metrics, and activity logs
🎮 **Interactive Buttons** - Mouse and keyboard navigation with visual feedback
⌨️ **Command Palette** - Quick actions with keyboard shortcuts
🔄 **Real-time Updates** - Async event handling with Tokio
📊 **Progress Bars** - Visual feedback for long-running operations
🎨 **Beautiful UI** - Clean, modern terminal interface with colors
🖱️ **Mouse Support** - Click buttons, scroll logs, resize panes
⚡ **Performance** - Efficient rendering and event handling

## Installation

```bash
cd /home/user/agentic-flow/capital-one-poc/crates/phi-cli
cargo build --release
```

## Usage

```bash
# Run the CLI
cargo run

# Or use the binary directly
./target/release/phi
```

## Commands

| Command | Description |
|---------|-------------|
| `train` | Train AI models with specified parameters |
| `deploy` | Deploy trained models to swarm infrastructure |
| `query` | Search and retrieve data from memory |
| `stats` | Display system statistics and metrics |
| `logs` | View application logs and history |
| `help` | Show help dialog |
| `quit` | Exit the application |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `:` or `/` | Enter command mode |
| `Tab` | Switch between buttons |
| `Shift+Tab` | Switch buttons backward |
| `Enter` | Execute selected button/command |
| `Esc` | Cancel/Back to dashboard |
| `h` | Toggle help |
| `q` | Quit application |
| `Ctrl+C` | Force quit |

## Button Shortcuts

| Key | Action |
|-----|--------|
| `s` | Start runtime |
| `d` | Deploy to swarm |
| `l` | View logs |

## Mouse Support

- Click buttons to execute actions
- Scroll through logs and command history
- Terminal resize handling

## Architecture

```
phi-cli/
├── src/
│   ├── main.rs              # Entry point with async event loop
│   ├── lib.rs               # Library exports
│   ├── app.rs               # Application state management
│   ├── ui.rs                # UI rendering logic
│   ├── events.rs            # Event handling system
│   ├── commands/
│   │   └── mod.rs           # Command execution handlers
│   └── components/
│       ├── mod.rs           # Component exports
│       ├── button.rs        # Interactive button widget
│       └── help.rs          # Help modal dialog
└── Cargo.toml               # Dependencies

```

## Technologies

- **[Ratatui](https://ratatui.rs/)** - Modern TUI framework
- **[Crossterm](https://docs.rs/crossterm/)** - Terminal manipulation
- **[Tokio](https://tokio.rs/)** - Async runtime

## Code Style

The codebase follows these principles:
- Clean component architecture
- Async event loop with Tokio
- Stateful widgets for interactive elements
- Reusable UI components
- Error handling with anyhow
- Type-safe event system

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ φ-AI System Console                    [H]elp [Q]uit│
├─────────────────────────────────────────────────────┤
│ System Status:                                      │
│  ● Runtime: Active                                  │
│  ● Memory: 847KB / 1MB                              │
│  ● Tasks: 12 active                                 │
│                                                     │
│ Actions:                                            │
│  [Start (s)]  [Stop]  [Deploy (d)]  [Logs (l)]    │
│                                                     │
│ Activity Log:                                       │
│  [12:34:56] ✓ Training completed                   │
│  [12:34:55] ℹ Executing: train --domain trading    │
│  [12:34:50] ✓ Deployment successful                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Command Input: _                                    │
└─────────────────────────────────────────────────────┘
```

## Development

```bash
# Run in development mode
cargo run

# Run tests
cargo test

# Check code
cargo check

# Format code
cargo fmt

# Lint
cargo clippy
```

## Error Handling

The application includes:
- Graceful degradation for terminals without color support
- Signal handling (Ctrl+C)
- Terminal resize handling
- Input validation
- Async error propagation

## Future Enhancements

- [ ] Syntax highlighting for code display
- [ ] Multi-pane layout with tabs
- [ ] Modal dialogs for confirmations
- [ ] Configuration file support
- [ ] Theme customization
- [ ] Command history navigation with arrow keys
- [ ] Auto-completion
- [ ] Search functionality in logs

## License

Part of the φ-AI system project.
