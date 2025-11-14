# φ-AI TUI Console Usage Guide

## Quick Start

```bash
# Run the TUI
cd /home/user/agentic-flow/capital-one-poc
cargo run --bin phi-tui --release

# Or use the compiled binary directly
./target/release/phi-tui
```

## Features

### 🎨 **Beautiful Dashboard Interface**
- Real-time system status monitoring
- Memory usage tracking with live updates
- Active task counter
- Runtime status indicator

### ⌨️ **Keyboard Navigation**

| Key | Action |
|-----|--------|
| `:` or `/` | Enter command mode |
| `Tab` | Switch between action buttons |
| `Shift+Tab` | Switch buttons backward |
| `Enter` | Execute selected button/command |
| `Esc` | Cancel/Back to dashboard |
| `h` | Toggle help modal |
| `q` | Quit application |
| `Ctrl+C` | Force quit |

### 🎮 **Button Shortcuts**

| Key | Button | Action |
|-----|--------|--------|
| `s` | Start | Start the runtime |
| `d` | Deploy | Deploy to swarm |
| `l` | Logs | View logs |

### 📝 **Available Commands**

Enter commands by pressing `:` or `/`:

- `train` - Train AI models with parameters
- `deploy` - Deploy to production swarm
- `query` - Search memory database
- `stats` - Display system statistics
- `logs` - View application logs
- `start` - Start runtime
- `stop` - Stop runtime
- `help` - Show help dialog
- `quit` - Exit application

### 🖱️ **Mouse Support**

- Click on buttons to execute actions
- Scroll through activity logs
- Terminal automatically responds to resize events

### 📊 **UI Layout**

```
┌─────────────────────────────────────────────────────┐
│ φ-AI System Console                    [H]elp [Q]uit│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ System Status:                                  │ │
│ │   Runtime: ● Active                             │ │
│ │   Memory: 847KB / 1MB (82.7%)                   │ │
│ │   Tasks: 12 active                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Actions:                                        │ │
│ │  ╔═══════════╗ ┌───────────┐ ┌───────────┐    │ │
│ │  ║ Start (s) ║ │ Stop      │ │ Deploy (d)│    │ │
│ │  ╚═══════════╝ └───────────┘ └───────────┘    │ │
│ │    ┌───────────┐                               │ │
│ │    │ Logs (l)  │                               │ │
│ │    └───────────┘                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Activity Log:                                   │ │
│ │  [12:34:56] ✓ Training completed               │ │
│ │  [12:34:55] ℹ Executing: train --domain trade  │ │
│ │  [12:34:50] ✓ Deployment successful            │ │
│ │  [12:34:45] ℹ φ-AI Console initialized         │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Command Input: _                                    │
└─────────────────────────────────────────────────────┘
```

## Progress Bars

When running long operations like `train` or `deploy`, a progress modal appears:

```
┌────────────── Progress ───────────────┐
│                                        │
│  Running train...                      │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░  45%     │
│  45 / 100                              │
│                                        │
└────────────────────────────────────────┘
```

## Help Modal

Press `h` or `Ctrl+H` to toggle the comprehensive help screen with:
- Complete command reference
- Keyboard shortcut guide
- Mouse support information

## Activity Log Icons

| Icon | Level | Color | Meaning |
|------|-------|-------|---------|
| ℹ | Info | Blue | Informational messages |
| ✓ | Success | Green | Successful operations |
| ⚠ | Warning | Yellow | Warnings or non-critical issues |
| ✗ | Error | Red | Errors or failures |

## Example Usage

### Starting a Training Session

1. Press `:` to enter command mode
2. Type `train --domain trading --epochs 100`
3. Press `Enter`
4. Watch the progress bar
5. View results in the activity log

### Quick Deploy

1. Press `d` (Deploy shortcut)
2. Or select "Deploy" button with `Tab` and press `Enter`

### Viewing Statistics

1. Press `:` to enter command mode
2. Type `stats`
3. Press `Enter`
4. Statistics appear in the activity log

## Architecture

```
phi-cli/
├── src/
│   ├── bin/
│   │   └── tui.rs           # TUI binary entry point
│   ├── main.rs              # Original CLI
│   ├── lib.rs               # Library exports
│   ├── app.rs               # Application state & logic
│   ├── ui.rs                # UI rendering
│   ├── events.rs            # Event handling system
│   ├── commands/
│   │   └── mod.rs           # Command execution
│   └── components/
│       ├── button.rs        # Button widget
│       └── help.rs          # Help modal
└── Cargo.toml               # Dependencies
```

## Dependencies

- **ratatui 0.27** - Modern TUI framework
- **crossterm 0.28** - Terminal manipulation
- **tokio 1.x** - Async runtime
- **chrono 0.4** - Timestamp handling
- **anyhow 1.0** - Error handling

## Development

```bash
# Build in debug mode
cargo build -p phi-cli --bin phi-tui

# Build in release mode (faster)
cargo build -p phi-cli --bin phi-tui --release

# Run directly
cargo run --bin phi-tui

# Run with optimizations
cargo run --bin phi-tui --release
```

## Troubleshooting

### Terminal Not Clearing Properly
If you interrupt the program with Ctrl+C abruptly, the terminal may be in a bad state:
```bash
reset
```

### Colors Not Displaying
Ensure your terminal supports 256 colors:
```bash
echo $TERM  # Should show something like "xterm-256color"
```

### Mouse Not Working
Mouse support requires a compatible terminal emulator. Most modern terminals support it out of the box.

## Technical Details

- **Async Architecture**: Built on Tokio for non-blocking operations
- **Event-Driven**: Tick-based UI updates (250ms intervals)
- **Efficient Rendering**: Only redraws on events
- **Memory Safe**: Rust guarantees no memory leaks
- **Cross-Platform**: Works on Linux, macOS, and Windows

## Performance

- Binary size: ~8-10MB (release build)
- Memory usage: ~5-10MB RAM
- UI refresh rate: 4 FPS (250ms ticks)
- Command execution: Async, non-blocking

## Future Enhancements

- [ ] Syntax highlighting for code display
- [ ] Multi-tab interface
- [ ] Command history navigation (↑/↓ arrows)
- [ ] Auto-completion
- [ ] Configurable themes
- [ ] Export logs to file
- [ ] Search functionality in logs
- [ ] Real-time metrics graphs

## License

Part of the φ-AI system project.
