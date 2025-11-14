use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};
use crate::app::App;

pub fn render_help_modal(f: &mut Frame, _app: &App) {
    let area = centered_rect(70, 70, f.size());
    let block = Block::default().borders(Borders::ALL).border_style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)).title(" Help - Press ESC or H to close ").style(Style::default().bg(Color::Black));
    f.render_widget(block.clone(), area);

    let inner = block.inner(area);
    let sections = Layout::default().direction(Direction::Vertical).constraints([Constraint::Length(3), Constraint::Length(10), Constraint::Length(10), Constraint::Min(5)]).margin(1).split(inner);

    let title = Paragraph::new(Line::from(vec![
        Span::styled("φ", Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
        Span::styled("-AI System Console", Style::default().fg(Color::White).add_modifier(Modifier::BOLD)),
    ])).alignment(ratatui::layout::Alignment::Center);
    f.render_widget(title, sections[0]);

    let commands = vec![
        ("train", "Train AI models with specified parameters"),
        ("deploy", "Deploy trained models to swarm infrastructure"),
        ("query", "Search and retrieve data from memory"),
        ("stats", "Display system statistics and metrics"),
        ("logs", "View application logs and history"),
        ("help", "Show this help dialog"),
        ("quit", "Exit the application"),
    ];

    let cmd_items: Vec<ListItem> = commands.iter().map(|(cmd, desc)| {
        ListItem::new(Line::from(vec![
            Span::styled(format!("{:<10}", cmd), Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)),
            Span::styled(desc.to_string(), Style::default().fg(Color::Gray)),
        ]))
    }).collect();

    let cmd_list = List::new(cmd_items).block(Block::default().borders(Borders::ALL).title("Commands"));
    f.render_widget(cmd_list, sections[1]);

    let shortcuts = vec![
        (":", "Enter command mode"),
        ("/", "Enter search mode"),
        ("Tab", "Switch between buttons"),
        ("Enter", "Execute selected button/command"),
        ("Esc", "Cancel/Back to dashboard"),
        ("h", "Toggle help"),
        ("q", "Quit application"),
        ("Ctrl+C", "Force quit"),
    ];

    let shortcut_items: Vec<ListItem> = shortcuts.iter().map(|(key, desc)| {
        ListItem::new(Line::from(vec![
            Span::styled(format!("{:<10}", key), Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)),
            Span::styled(desc.to_string(), Style::default().fg(Color::Gray)),
        ]))
    }).collect();

    let shortcut_list = List::new(shortcut_items).block(Block::default().borders(Borders::ALL).title("Keyboard Shortcuts"));
    f.render_widget(shortcut_list, sections[2]);

    let mouse_info = vec![
        Line::from(vec![Span::styled("● ", Style::default().fg(Color::Green)), Span::styled("Click buttons to execute actions", Style::default().fg(Color::Gray))]),
        Line::from(vec![Span::styled("● ", Style::default().fg(Color::Green)), Span::styled("Scroll through logs and history", Style::default().fg(Color::Gray))]),
        Line::from(vec![Span::styled("● ", Style::default().fg(Color::Green)), Span::styled("Resize terminal for responsive layout", Style::default().fg(Color::Gray))]),
    ];

    let mouse_block = Paragraph::new(mouse_info).block(Block::default().borders(Borders::ALL).title("Mouse Support"));
    f.render_widget(mouse_block, sections[3]);
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default().direction(Direction::Vertical).constraints([Constraint::Percentage((100 - percent_y) / 2), Constraint::Percentage(percent_y), Constraint::Percentage((100 - percent_y) / 2)]).split(r);
    Layout::default().direction(Direction::Horizontal).constraints([Constraint::Percentage((100 - percent_x) / 2), Constraint::Percentage(percent_x), Constraint::Percentage((100 - percent_x) / 2)]).split(popup_layout[1])[1]
}
