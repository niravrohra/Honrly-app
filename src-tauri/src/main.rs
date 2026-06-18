#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
struct ProcessInfo {
    pid: String,
    name: String,
}

#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn CGEventSourceSecondsSinceLastEventType(state_id: u32, event_type: u32) -> f64;
}

/// Returns the list of currently running processes (pid + full command/name).
/// Everything stays local — nothing is uploaded anywhere.
#[tauri::command]
fn list_processes() -> Vec<ProcessInfo> {
    let mut processes = vec![];

    #[cfg(target_os = "macos")]
    {
        let output = Command::new("ps")
            .arg("-axo")
            .arg("pid,args")
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let parts: Vec<&str> = line.trim().splitn(2, ' ').collect();
                if parts.len() == 2 {
                    processes.push(ProcessInfo {
                        pid: parts[0].to_string(),
                        name: parts[1].trim().to_string(),
                    });
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("ps")
            .arg("-axo")
            .arg("pid,args")
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let parts: Vec<&str> = line.trim().splitn(2, ' ').collect();
                if parts.len() == 2 {
                    processes.push(ProcessInfo {
                        pid: parts[0].to_string(),
                        name: parts[1].trim().to_string(),
                    });
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        // tasklist outputs CSV: "ImageName","PID","SessionName","Session#","MemUsage"
        let output = Command::new("tasklist")
            .arg("/FO")
            .arg("CSV")
            .arg("/NH")
            .output();

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let cols: Vec<&str> = line.split("\",\"").collect();
                if cols.len() >= 2 {
                    let name = cols[0].trim_matches('"').to_string();
                    let pid = cols[1].trim_matches('"').to_string();
                    processes.push(ProcessInfo { pid, name });
                }
            }
        }
    }

    processes
}

/// Returns true if there has been keyboard/mouse input in the last ~3 seconds.
/// Useful for liveness/presence checks during a monitored call.
#[tauri::command]
fn get_input_activity() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        const K_CG_EVENT_SOURCE_STATE_HID_SYSTEM_STATE: u32 = 1;
        const K_CG_EVENT_KEY_DOWN: u32 = 10;

        let idle_secs = unsafe {
            CGEventSourceSecondsSinceLastEventType(
                K_CG_EVENT_SOURCE_STATE_HID_SYSTEM_STATE,
                K_CG_EVENT_KEY_DOWN,
            )
        };

        Ok(idle_secs < 3.0)
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Not implemented on this platform yet.
        Err("get_input_activity is only implemented on macOS".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_processes,
            get_input_activity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
