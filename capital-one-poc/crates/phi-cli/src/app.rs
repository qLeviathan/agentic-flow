use anyhow::Result;
use chrono::{DateTime, Local};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers, MouseEvent};
use std::collections::VecDeque;
use tokio::sync::mpsc;

use crate::commands::{CommandResult, CommandType};
use crate::events::Event;

#[derive(Debug, Clone, PartialEq)]
pub enum AppState {
    Dashboard,
    CommandInput,
    Modal(String),
}

#[derive(Debug, Clone)]
pub struct SystemStatus {
    pub runtime_active: bool,
    pub memory_used: u64,
    pub memory_total: u64,
    pub active_tasks: u32,
    pub last_updated: DateTime<Local>,
}

#[derive(Debug, Clone)]
pub struct LogEntry {
    pub timestamp: DateTime<Local>,
    pub level: LogLevel,
    pub message: String,
}

#[derive(Debug, Clone)]
pub enum LogLevel {
    Info,
    Success,
    Warning,
    Error,
}

pub struct App {
    pub state: AppState,
    pub system_status: SystemStatus,
    pub command_history: VecDeque<String>,
    pub command_input: String,
    pub cursor_position: usize,
    pub logs: VecDeque<LogEntry>,
    pub selected_button: usize,
    pub buttons: Vec<Button>,
    pub show_help: bool,
    pub progress: Option<Progress>,
    tx: mpsc::Sender<Event>,
}

#[derive(Debug, Clone)]
pub struct Button {
    pub label: String,
    pub command: String,
    pub shortcut: Option<char>,
}

#[derive(Debug, Clone)]
pub struct Progress {
    pub label: String,
    pub current: u64,
    pub total: u64,
}

impl App {
    pub fn new(tx: mpsc::Sender<Event>) -> Self {
        let buttons = vec![
            Button { label: "Start".to_string(), command: "start".to_string(), shortcut: Some('s') },
            Button { label: "Stop".to_string(), command: "stop".to_string(), shortcut: None },
            Button { label: "Deploy".to_string(), command: "deploy".to_string(), shortcut: Some('d') },
            Button { label: "Logs".to_string(), command: "logs".to_string(), shortcut: Some('l') },
        ];

        let mut logs = VecDeque::new();
        logs.push_back(LogEntry {
            timestamp: Local::now(),
            level: LogLevel::Info,
            message: "φ-AI Console initialized".to_string(),
        });

        Self {
            state: AppState::Dashboard,
            system_status: SystemStatus {
                runtime_active: true,
                memory_used: 847 * 1024,
                memory_total: 1024 * 1024,
                active_tasks: 12,
                last_updated: Local::now(),
            },
            command_history: VecDeque::new(),
            command_input: String::new(),
            cursor_position: 0,
            logs,
            selected_button: 0,
            buttons,
            show_help: false,
            progress: None,
            tx,
        }
    }

    pub async fn on_tick(&mut self) {
        self.system_status.last_updated = Local::now();
        if self.system_status.runtime_active {
            self.system_status.memory_used = (self.system_status.memory_used + 1024) % self.system_status.memory_total;
        }
    }

    pub async fn on_key(&mut self, key: KeyEvent) -> Result<()> {
        if key.modifiers.contains(KeyModifiers::CONTROL) {
            match key.code {
                KeyCode::Char('c') => { self.tx.send(Event::Quit).await?; return Ok(()); }
                KeyCode::Char('h') => { self.show_help = !self.show_help; return Ok(()); }
                _ => {}
            }
        }

        match self.state {
            AppState::Dashboard => self.handle_dashboard_key(key).await?,
            AppState::CommandInput => self.handle_command_input_key(key).await?,
            AppState::Modal(_) => self.handle_modal_key(key).await?,
        }
        Ok(())
    }

    async fn handle_dashboard_key(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Char('q') => { self.tx.send(Event::Quit).await?; }
            KeyCode::Char('h') => { self.show_help = !self.show_help; }
            KeyCode::Char(':') | KeyCode::Char('/') => {
                self.state = AppState::CommandInput;
                self.command_input.clear();
                self.cursor_position = 0;
            }
            KeyCode::Tab => { self.selected_button = (self.selected_button + 1) % self.buttons.len(); }
            KeyCode::BackTab => {
                self.selected_button = if self.selected_button == 0 { self.buttons.len() - 1 } else { self.selected_button - 1 };
            }
            KeyCode::Enter => {
                let command = self.buttons[self.selected_button].command.clone();
                self.execute_command(&command).await?;
            }
            KeyCode::Char(c) => {
                let command_opt = self.buttons.iter().enumerate().find_map(|(idx, button)| {
                    if button.shortcut == Some(c) { Some((idx, button.command.clone())) } else { None }
                });
                if let Some((idx, command)) = command_opt {
                    self.selected_button = idx;
                    self.execute_command(&command).await?;
                }
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_command_input_key(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Esc => { self.state = AppState::Dashboard; }
            KeyCode::Enter => {
                let command = self.command_input.clone();
                if !command.is_empty() {
                    self.command_history.push_back(command.clone());
                    if self.command_history.len() > 100 { self.command_history.pop_front(); }
                    self.execute_command(&command).await?;
                    self.command_input.clear();
                    self.cursor_position = 0;
                }
                self.state = AppState::Dashboard;
            }
            KeyCode::Char(c) => { self.command_input.insert(self.cursor_position, c); self.cursor_position += 1; }
            KeyCode::Backspace => {
                if self.cursor_position > 0 { self.command_input.remove(self.cursor_position - 1); self.cursor_position -= 1; }
            }
            KeyCode::Delete => { if self.cursor_position < self.command_input.len() { self.command_input.remove(self.cursor_position); } }
            KeyCode::Left => { if self.cursor_position > 0 { self.cursor_position -= 1; } }
            KeyCode::Right => { if self.cursor_position < self.command_input.len() { self.cursor_position += 1; } }
            KeyCode::Home => { self.cursor_position = 0; }
            KeyCode::End => { self.cursor_position = self.command_input.len(); }
            _ => {}
        }
        Ok(())
    }

    async fn handle_modal_key(&mut self, key: KeyEvent) -> Result<()> {
        match key.code {
            KeyCode::Esc | KeyCode::Enter => { self.state = AppState::Dashboard; }
            _ => {}
        }
        Ok(())
    }

    pub async fn on_mouse(&mut self, _mouse: MouseEvent) -> Result<()> { Ok(()) }
    pub async fn on_resize(&mut self, _width: u16, _height: u16) {}

    pub async fn on_command_result(&mut self, result: CommandResult) {
        self.add_log(result.level, &result.message);
        self.progress = None;
    }

    async fn execute_command(&mut self, command: &str) -> Result<()> {
        let parts: Vec<&str> = command.split_whitespace().collect();
        if parts.is_empty() { return Ok(()); }

        let cmd_type = match parts[0] {
            "train" => CommandType::Train,
            "deploy" => CommandType::Deploy,
            "query" => CommandType::Query,
            "stats" => CommandType::Stats,
            "logs" => CommandType::Logs,
            "start" => CommandType::Start,
            "stop" => CommandType::Stop,
            "help" => { self.show_help = true; return Ok(()); }
            "quit" | "exit" => { self.tx.send(Event::Quit).await?; return Ok(()); }
            _ => { self.add_log(LogLevel::Error, &format!("Unknown command: {}", parts[0])); return Ok(()); }
        };

        self.add_log(LogLevel::Info, &format!("Executing: {}", command));

        if matches!(cmd_type, CommandType::Train | CommandType::Deploy) {
            self.progress = Some(Progress { label: format!("Running {}...", parts[0]), current: 0, total: 100 });
        }

        let tx = self.tx.clone();
        let cmd = command.to_string();
        tokio::spawn(async move {
            let result = crate::commands::execute_command(&cmd_type, &cmd).await;
            let _ = tx.send(Event::Command(result)).await;
        });

        Ok(())
    }

    pub fn add_log(&mut self, level: LogLevel, message: &str) {
        self.logs.push_back(LogEntry { timestamp: Local::now(), level, message: message.to_string() });
        if self.logs.len() > 1000 { self.logs.pop_front(); }
    }
}
