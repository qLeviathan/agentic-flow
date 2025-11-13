// Prevent console window on Windows in release mode
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri_anthropic_app::run();
}
