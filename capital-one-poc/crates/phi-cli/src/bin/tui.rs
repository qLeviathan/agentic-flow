use anyhow::Result;
use crossterm::{
    event::{DisableMouseCapture, EnableMouseCapture},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::CrosstermBackend, Terminal};
use std::io;
use tokio::sync::mpsc;

use phi_cli::{app::App, events::{Event, EventHandler}, ui};

#[tokio::main]
async fn main() -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create app and event handler
    let (tx, mut rx) = mpsc::channel(100);
    let mut app = App::new(tx.clone());
    let event_handler = EventHandler::new(tx);

    // Spawn event handler
    tokio::spawn(async move {
        event_handler.run().await;
    });

    // Main event loop
    let result = run_app(&mut terminal, &mut app, &mut rx).await;

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    if let Err(err) = result {
        eprintln!("Error: {}", err);
    }

    Ok(())
}

async fn run_app(
    terminal: &mut Terminal<CrosstermBackend<io::Stdout>>,
    app: &mut App,
    rx: &mut mpsc::Receiver<Event>,
) -> Result<()> {
    loop {
        // Draw UI
        terminal.draw(|f| ui::draw(f, app))?;

        // Handle events
        if let Some(event) = rx.recv().await {
            match event {
                Event::Quit => break,
                Event::Tick => app.on_tick().await,
                Event::Key(key) => app.on_key(key).await?,
                Event::Mouse(mouse) => app.on_mouse(mouse).await?,
                Event::Resize(width, height) => app.on_resize(width, height).await,
                Event::Command(result) => app.on_command_result(result).await,
            }
        }
    }

    Ok(())
}
