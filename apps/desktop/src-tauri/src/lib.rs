mod local_model;
mod windows;
use local_model::{chat_local_model, test_local_model};

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, RunEvent, WindowEvent,
};
use tauri_plugin_window_state::StateFlags;
use windows::{hide_house, hide_main, show_house, show_main, HOUSE_WINDOW, MAIN_WINDOW};

const KEYCHAIN_SERVICE: &str = "com.oneshow.home";
const KEYCHAIN_ACCOUNT: &str = "installation";

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct InstallationCredential {
    token: String,
}

const MENU_OPEN_HOME: &str = "open-home";
const MENU_SHOW_HOUSE: &str = "show-house";
const MENU_HIDE_HOUSE: &str = "hide-house";
const MENU_QUIT: &str = "quit";
static HOME_TRANSITION_PENDING: AtomicBool = AtomicBool::new(false);

fn should_show_main<I>(arguments: I) -> bool
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    arguments
        .into_iter()
        .any(|argument| argument.as_ref() == "--show-main")
}

fn should_preview_transition<I>(arguments: I) -> bool
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    arguments
        .into_iter()
        .any(|argument| argument.as_ref() == "--preview-home-transition")
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    show_main(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn begin_home_transition(app: tauri::AppHandle) -> Result<(), String> {
    HOME_TRANSITION_PENDING.store(true, Ordering::Release);
    show_main(&app).map_err(|error| error.to_string())?;
    app.emit_to(MAIN_WINDOW, "home-entry-started", ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn consume_home_transition() -> bool {
    HOME_TRANSITION_PENDING.swap(false, Ordering::AcqRel)
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) -> Result<(), String> {
    hide_main(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn show_house_window(app: tauri::AppHandle) -> Result<(), String> {
    show_house(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_installation_credential() -> Result<Option<InstallationCredential>, String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|error| error.to_string())?;
    match entry.get_password() {
        Ok(value) => serde_json::from_str(&value)
            .map(Some)
            .map_err(|error| error.to_string()),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn save_installation_credential(credential: InstallationCredential) -> Result<(), String> {
    if credential.token.len() < 40 || credential.token.len() > 200 {
        return Err("invalid installation credential".to_string());
    }
    let value = serde_json::to_string(&credential).map_err(|error| error.to_string())?;
    keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|error| error.to_string())?
        .set_password(&value)
        .map_err(|error| error.to_string())
}

fn create_tray(app: &tauri::App) -> tauri::Result<()> {
    let open_home = MenuItem::with_id(app, MENU_OPEN_HOME, "打开 Home", true, None::<&str>)?;
    let show_house_item =
        MenuItem::with_id(app, MENU_SHOW_HOUSE, "显示桌面小屋", true, None::<&str>)?;
    let hide_house_item =
        MenuItem::with_id(app, MENU_HIDE_HOUSE, "隐藏桌面小屋", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "退出 OneShow Home", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[&open_home, &show_house_item, &hide_house_item, &quit],
    )?;

    let mut tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true)
        .tooltip("OneShow Home");

    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }

    tray.on_menu_event(|app, event| match event.id().as_ref() {
        MENU_OPEN_HOME => {
            let _ = show_main(app);
        }
        MENU_SHOW_HOUSE => {
            let _ = show_house(app);
        }
        MENU_HIDE_HOUSE => {
            let _ = hide_house(app);
        }
        MENU_QUIT => app.exit(0),
        _ => {}
    })
    .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let arguments = std::env::args().collect::<Vec<_>>();
    let preview_transition_on_ready = should_preview_transition(&arguments);
    let show_main_on_ready = should_show_main(&arguments) || preview_transition_on_ready;
    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::POSITION)
                .with_filter(|label| label == HOUSE_WINDOW)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            begin_home_transition,
            consume_home_transition,
            show_main_window,
            hide_main_window,
            show_house_window,
            load_installation_credential,
            save_installation_credential,
            test_local_model,
            chat_local_model
        ])
        .setup(|app| {
            create_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == MAIN_WINDOW {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("failed to build OneShow Home");

    app.run(move |app_handle, event| {
        if show_main_on_ready && matches!(event, RunEvent::Ready) {
            if preview_transition_on_ready {
                HOME_TRANSITION_PENDING.store(true, Ordering::Release);
            }
            let _ = show_main(app_handle);
            if preview_transition_on_ready {
                let app = app_handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(2000));
                    HOME_TRANSITION_PENDING.store(true, Ordering::Release);
                    let _ = app.emit_to(MAIN_WINDOW, "home-entry-started", ());
                });
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::{
        should_preview_transition, should_show_main, MENU_HIDE_HOUSE, MENU_OPEN_HOME, MENU_QUIT,
        MENU_SHOW_HOUSE,
    };

    #[test]
    fn tray_menu_ids_are_stable_and_unique() {
        let ids = [MENU_OPEN_HOME, MENU_SHOW_HOUSE, MENU_HIDE_HOUSE, MENU_QUIT];

        for (index, id) in ids.iter().enumerate() {
            assert!(ids.iter().skip(index + 1).all(|candidate| candidate != id));
        }
    }

    #[test]
    fn qa_flag_can_open_the_main_window() {
        assert!(should_show_main(["oneshow-home", "--show-main"]));
        assert!(!should_show_main(["oneshow-home"]));
    }

    #[test]
    fn qa_flag_can_preview_the_entry_transition() {
        assert!(should_preview_transition([
            "oneshow-home",
            "--preview-home-transition"
        ]));
        assert!(!should_preview_transition(["oneshow-home"]));
    }
}
