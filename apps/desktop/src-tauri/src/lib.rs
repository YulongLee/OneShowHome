mod windows;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    RunEvent, WindowEvent,
};
use tauri_plugin_window_state::StateFlags;
use windows::{hide_house, hide_main, show_house, show_main, HOUSE_WINDOW, MAIN_WINDOW};

const MENU_OPEN_HOME: &str = "open-home";
const MENU_SHOW_HOUSE: &str = "show-house";
const MENU_HIDE_HOUSE: &str = "hide-house";
const MENU_QUIT: &str = "quit";

fn should_show_main<I>(arguments: I) -> bool
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    arguments
        .into_iter()
        .any(|argument| argument.as_ref() == "--show-main")
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    show_main(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) -> Result<(), String> {
    hide_main(&app).map_err(|error| error.to_string())
}

#[tauri::command]
fn show_house_window(app: tauri::AppHandle) -> Result<(), String> {
    show_house(&app).map_err(|error| error.to_string())
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
    let show_main_on_ready = should_show_main(std::env::args());
    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::POSITION)
                .with_filter(|label| label == HOUSE_WINDOW)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            show_house_window
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
            let _ = show_main(app_handle);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::{should_show_main, MENU_HIDE_HOUSE, MENU_OPEN_HOME, MENU_QUIT, MENU_SHOW_HOUSE};

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
}
