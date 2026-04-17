// Prevent console window on Windows release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

/// Holds the spawned Node backend child process so we can kill it on exit.
struct BackendHandle(Mutex<Option<Child>>);

fn spawn_backend(app: &tauri::AppHandle) -> Option<Child> {
    // Resolve the bundled backend directory.
    // In dev: ../backend (relative to src-tauri working dir).
    // In release: resources/backend (bundled via tauri.conf.json).
    let resource_dir = app
        .path()
        .resource_dir()
        .ok()
        .map(|p| p.join("backend"))
        .filter(|p| p.exists());

    let dev_dir = std::env::current_dir()
        .ok()
        .map(|p| p.join("..").join("backend"))
        .filter(|p| p.exists());

    let backend_dir = resource_dir.or(dev_dir)?;
    let entry = backend_dir.join("src").join("server.js");

    let child = Command::new("node")
        .arg(entry)
        .current_dir(&backend_dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .ok()?;
    Some(child)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(BackendHandle(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle().clone();
            let child = spawn_backend(&handle);
            if let Some(c) = child {
                let state = app.state::<BackendHandle>();
                *state.0.lock().unwrap() = Some(c);
            } else {
                eprintln!(
                    "Warning: could not spawn Node backend. Make sure node.exe is on PATH \
                     and the backend/ directory exists."
                );
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::ExitRequested { .. } | RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<BackendHandle>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
