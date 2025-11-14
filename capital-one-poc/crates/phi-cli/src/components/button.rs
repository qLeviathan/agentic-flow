use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Frame,
};
use crate::app::App;

pub fn render_buttons(f: &mut Frame, area: Rect, app: &App) {
    let block = Block::default().borders(Borders::ALL).title("Actions");
    let inner = block.inner(area);
    f.render_widget(block, area);

    let button_count = app.buttons.len();
    let constraints: Vec<Constraint> = (0..button_count).map(|_| Constraint::Percentage(100 / button_count as u16)).collect();
    let button_areas = Layout::default().direction(Direction::Horizontal).constraints(constraints).margin(1).split(inner);

    for (idx, button) in app.buttons.iter().enumerate() {
        let is_selected = idx == app.selected_button;
        render_button(f, button_areas[idx], &button.label, &button.shortcut, is_selected);
    }
}

fn render_button(f: &mut Frame, area: Rect, label: &str, shortcut: &Option<char>, is_selected: bool) {
    let style = if is_selected {
        Style::default().fg(Color::Black).bg(Color::Cyan).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::Cyan).add_modifier(Modifier::DIM)
    };

    let border_style = if is_selected {
        Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let mut spans = vec![Span::styled(label, style)];
    if let Some(key) = shortcut {
        spans.push(Span::raw(" "));
        spans.push(Span::styled(format!("({})", key), Style::default().fg(Color::Yellow).add_modifier(Modifier::DIM)));
    }

    let block = Block::default().borders(Borders::ALL).border_style(border_style).style(if is_selected { Style::default().bg(Color::DarkGray) } else { Style::default() });
    let paragraph = Paragraph::new(Line::from(spans)).block(block).alignment(ratatui::layout::Alignment::Center);
    f.render_widget(paragraph, area);
}
