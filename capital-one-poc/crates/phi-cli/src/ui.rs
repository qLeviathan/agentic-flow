use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Gauge, List, ListItem, Paragraph},
    Frame,
};

use crate::app::{App, AppState, LogLevel};
use crate::components::{button::render_buttons, help::render_help_modal};

pub fn draw(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(3), Constraint::Min(10), Constraint::Length(3)])
        .split(f.size());

    render_title_bar(f, chunks[0], app);

    let content_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(6), Constraint::Length(6), Constraint::Min(5)])
        .margin(1)
        .split(chunks[1]);

    render_system_status(f, content_chunks[0], app);
    render_buttons(f, content_chunks[1], app);
    render_command_history(f, content_chunks[2], app);
    render_command_input(f, chunks[2], app);

    if let Some(progress) = &app.progress {
        render_progress(f, progress);
    }

    if app.show_help {
        render_help_modal(f, app);
    }
}

fn render_title_bar(f: &mut Frame, area: Rect, app: &App) {
    let title = vec![
        Span::styled("φ", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
        Span::raw("-AI System Console                    "),
        Span::styled("[H]", Style::default().fg(Color::Yellow)),
        Span::raw("elp "),
        Span::styled("[Q]", Style::default().fg(Color::Yellow)),
        Span::raw("uit"),
    ];

    let status_indicator = if app.system_status.runtime_active {
        Span::styled("● ", Style::default().fg(Color::Green))
    } else {
        Span::styled("○ ", Style::default().fg(Color::Red))
    };

    let title_line = Line::from(vec![
        status_indicator,
        Span::raw("Runtime "),
        Span::styled(
            if app.system_status.runtime_active { "Active" } else { "Inactive" },
            Style::default().fg(if app.system_status.runtime_active { Color::Green } else { Color::Red })
        ),
    ]);

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan))
        .title(Line::from(title));

    let paragraph = Paragraph::new(title_line).block(block);
    f.render_widget(paragraph, area);
}

fn render_system_status(f: &mut Frame, area: Rect, app: &App) {
    let memory_percent = (app.system_status.memory_used as f64 / app.system_status.memory_total as f64) * 100.0;
    let memory_kb_used = app.system_status.memory_used / 1024;
    let memory_kb_total = app.system_status.memory_total / 1024;

    let lines = vec![
        Line::from(vec![
            Span::styled("Runtime: ", Style::default().fg(Color::Gray)),
            Span::styled(
                if app.system_status.runtime_active { "Active" } else { "Inactive" },
                Style::default().fg(if app.system_status.runtime_active { Color::Green } else { Color::Red }).add_modifier(Modifier::BOLD)
            ),
        ]),
        Line::from(vec![
            Span::styled("Memory:  ", Style::default().fg(Color::Gray)),
            Span::styled(format!("{}KB / {}KB ({:.1}%)", memory_kb_used, memory_kb_total, memory_percent), Style::default().fg(Color::Cyan)),
        ]),
        Line::from(vec![
            Span::styled("Tasks:   ", Style::default().fg(Color::Gray)),
            Span::styled(format!("{} active", app.system_status.active_tasks), Style::default().fg(Color::Yellow)),
        ]),
    ];

    let block = Block::default().borders(Borders::ALL).title("System Status");
    let paragraph = Paragraph::new(lines).block(block);
    f.render_widget(paragraph, area);
}

fn render_command_history(f: &mut Frame, area: Rect, app: &App) {
    let log_items: Vec<ListItem> = app.logs.iter().rev().take(area.height.saturating_sub(2) as usize).map(|log| {
        let time = log.timestamp.format("%H:%M:%S");
        let (icon, style) = match log.level {
            LogLevel::Info => ("ℹ", Style::default().fg(Color::Blue)),
            LogLevel::Success => ("✓", Style::default().fg(Color::Green)),
            LogLevel::Warning => ("⚠", Style::default().fg(Color::Yellow)),
            LogLevel::Error => ("✗", Style::default().fg(Color::Red)),
        };

        let content = Line::from(vec![
            Span::styled(format!("[{}] ", time), Style::default().fg(Color::Gray)),
            Span::styled(format!("{} ", icon), style),
            Span::raw(&log.message),
        ]);

        ListItem::new(content)
    }).collect();

    let block = Block::default().borders(Borders::ALL).title("Activity Log");
    let list = List::new(log_items).block(block);
    f.render_widget(list, area);
}

fn render_command_input(f: &mut Frame, area: Rect, app: &App) {
    let (input_text, cursor_style) = match app.state {
        AppState::CommandInput => {
            let mut text = app.command_input.clone();
            if app.cursor_position <= text.len() {
                text.insert(app.cursor_position, '█');
            }
            (text, Style::default().fg(Color::Yellow))
        }
        _ => {
            ("Press : or / to enter command_".to_string(), Style::default().fg(Color::DarkGray))
        }
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(match app.state {
            AppState::CommandInput => Style::default().fg(Color::Yellow),
            _ => Style::default().fg(Color::White),
        })
        .title("Command Input");

    let paragraph = Paragraph::new(input_text).block(block).style(cursor_style);
    f.render_widget(paragraph, area);
}

fn render_progress(f: &mut Frame, progress: &crate::app::Progress) {
    let area = centered_rect(60, 20, f.size());
    let block = Block::default().borders(Borders::ALL).border_style(Style::default().fg(Color::Yellow)).title("Progress").style(Style::default().bg(Color::Black));
    f.render_widget(block, area);

    let inner = Layout::default().direction(Direction::Vertical).constraints([Constraint::Length(1), Constraint::Length(2), Constraint::Length(1)]).margin(2).split(area);

    let label = Paragraph::new(progress.label.as_str()).style(Style::default().fg(Color::White));
    f.render_widget(label, inner[0]);

    let ratio = progress.current as f64 / progress.total as f64;
    let gauge = Gauge::default().block(Block::default()).gauge_style(Style::default().fg(Color::Cyan).bg(Color::DarkGray)).ratio(ratio).label(format!("{:.0}%", ratio * 100.0));
    f.render_widget(gauge, inner[1]);

    let stats = Paragraph::new(format!("{} / {}", progress.current, progress.total)).style(Style::default().fg(Color::Gray));
    f.render_widget(stats, inner[2]);
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default().direction(Direction::Vertical).constraints([Constraint::Percentage((100 - percent_y) / 2), Constraint::Percentage(percent_y), Constraint::Percentage((100 - percent_y) / 2)]).split(r);
    Layout::default().direction(Direction::Horizontal).constraints([Constraint::Percentage((100 - percent_x) / 2), Constraint::Percentage(percent_x), Constraint::Percentage((100 - percent_x) / 2)]).split(popup_layout[1])[1]
}
