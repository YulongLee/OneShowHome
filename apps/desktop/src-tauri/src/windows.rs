use tauri::{AppHandle, Manager, Runtime};

pub const MAIN_WINDOW: &str = "main";
pub const HOUSE_WINDOW: &str = "house";

pub fn show_main<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        window.unminimize()?;
        window.show()?;
        window.set_focus()?;
    }
    Ok(())
}

pub fn hide_main<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        window.hide()?;
    }
    Ok(())
}

pub fn show_house<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(HOUSE_WINDOW) {
        window.show()?;
    }
    Ok(())
}

pub fn hide_house<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(HOUSE_WINDOW) {
        window.hide()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{HOUSE_WINDOW, MAIN_WINDOW};

    #[test]
    fn window_labels_are_stable_and_distinct() {
        assert_eq!(MAIN_WINDOW, "main");
        assert_eq!(HOUSE_WINDOW, "house");
        assert_ne!(MAIN_WINDOW, HOUSE_WINDOW);
    }
}
