use crossterm::event::{self, Event as CrosstermEvent, KeyEvent, MouseEvent};
use std::time::Duration;
use tokio::sync::mpsc;
use crate::commands::CommandResult;

#[derive(Debug)]
pub enum Event {
    Key(KeyEvent),
    Mouse(MouseEvent),
    Resize(u16, u16),
    Tick,
    Command(CommandResult),
    Quit,
}

pub struct EventHandler {
    tx: mpsc::Sender<Event>,
}

impl EventHandler {
    pub fn new(tx: mpsc::Sender<Event>) -> Self {
        Self { tx }
    }

    pub async fn run(self) {
        let mut tick_interval = tokio::time::interval(Duration::from_millis(250));

        loop {
            tokio::select! {
                _ = tick_interval.tick() => {
                    if self.tx.send(Event::Tick).await.is_err() {
                        break;
                    }
                }
                _ = tokio::task::spawn_blocking(|| {
                    event::poll(Duration::from_millis(100))
                }) => {
                    if let Ok(true) = event::poll(Duration::from_millis(10)) {
                        match event::read() {
                            Ok(CrosstermEvent::Key(key)) => {
                                if self.tx.send(Event::Key(key)).await.is_err() {
                                    break;
                                }
                            }
                            Ok(CrosstermEvent::Mouse(mouse)) => {
                                if self.tx.send(Event::Mouse(mouse)).await.is_err() {
                                    break;
                                }
                            }
                            Ok(CrosstermEvent::Resize(w, h)) => {
                                if self.tx.send(Event::Resize(w, h)).await.is_err() {
                                    break;
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }
}
