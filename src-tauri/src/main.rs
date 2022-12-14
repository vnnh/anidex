#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod app;
mod commands;
use commands::set_activity::{set_discord_activity, DiscordIntegrationState, SetActivityPayload};
use tauri::{State, WindowBuilder, WindowUrl};
use tauri_plugin_store;
use window_shadows::set_shadow;

#[tauri::command]
async fn set_activity(
    state: State<'_, DiscordIntegrationState>,
    payload: Option<SetActivityPayload>,
) -> Result<bool, ()> {
    let a = set_discord_activity(state, payload).await;
    Ok(a)
}

fn main() {
    tauri::Builder::default()
        .plugin(app::window_state::Builder::default().build())
        .plugin(tauri_plugin_store::PluginBuilder::default().build())
        .setup(|app| {
            let window_builder = WindowBuilder::new(app, "main", WindowUrl::default())
                .title("Anidex")
                .inner_size(1000., 800.)
                .min_inner_size(600., 400.)
                .visible(true)
                .transparent(true)
                .decorations(false);

            let window = window_builder.build().unwrap();
            set_shadow(&window, true).unwrap();

            window_vibrancy::apply_mica(&window).unwrap();

            #[cfg(debug_assertions)]
            window.open_devtools();

            Ok(())
        })
        .manage(DiscordIntegrationState::default())
        .invoke_handler(tauri::generate_handler![set_activity])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
