// Copyright 2021 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    Manager, PhysicalPosition, PhysicalSize, Position, RunEvent, Runtime, Size, Window,
    WindowEvent,
};

use std::{
    collections::HashMap,
    fs::{create_dir_all, File},
    io::Write,
    sync::{Arc, Mutex},
};

const STATE_FILENAME: &str = ".window-state";

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Tauri(#[from] tauri::Error),
    #[error(transparent)]
    TauriApi(#[from] tauri::api::Error),
    #[error(transparent)]
    Bincode(#[from] Box<bincode::ErrorKind>),
}

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Default, Deserialize, Serialize)]
struct WindowMetadata {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    maximized: bool,
    visible: bool,
}

struct WindowStateCache(Arc<Mutex<HashMap<String, WindowMetadata>>>);

pub trait AppHandleExt {
    fn save_window_state(&self) -> Result<()>;
}

impl<R: Runtime> AppHandleExt for tauri::AppHandle<R> {
    fn save_window_state(&self) -> Result<()> {
        if let Some(app_dir) = self.path_resolver().app_data_dir() {
            let state_path = app_dir.join(STATE_FILENAME);
            let cache = self.state::<WindowStateCache>();
            let state = cache.0.lock().unwrap();
            create_dir_all(&app_dir)
                .map_err(Error::Io)
                .and_then(|_| File::create(state_path).map_err(Into::into))
                .and_then(|mut f| {
                    f.write_all(&bincode::serialize(&*state).map_err(Error::Bincode)?)
                        .map_err(Into::into)
                })
        } else {
            Ok(())
        }
    }
}

pub trait WindowExt {
    fn restore_state(&self) -> tauri::Result<()>;
}

impl<R: Runtime> WindowExt for Window<R> {
    fn restore_state(&self) -> tauri::Result<()> {
        let cache = self.state::<WindowStateCache>();
        let mut c = cache.0.lock().unwrap();
        let mut should_show = true;
        if let Some(state) = c.get(self.label()) {
            self.set_position(Position::Physical(PhysicalPosition {
                x: state.x,
                y: state.y,
            }))?;
            self.set_size(Size::Physical(PhysicalSize {
                width: state.width,
                height: state.height,
            }))?;
            if state.maximized {
                self.maximize()?;
            }
            should_show = state.visible;
        } else {
            let PhysicalSize { width, height } = self.inner_size()?;
            let PhysicalPosition { x, y } = self.outer_position()?;
            let maximized = self.is_maximized().unwrap_or(false);
            let visible = self.is_visible().unwrap_or(true);
            c.insert(
                self.label().into(),
                WindowMetadata {
                    width,
                    height,
                    x,
                    y,
                    maximized,
                    visible,
                },
            );
        }
        if should_show {
            self.show()?;
            self.set_focus()?;
        }

        Ok(())
    }
}

#[derive(Default)]
pub struct Builder {
    skip_check_on_window_create: bool,
}

impl Builder {
    pub fn skip_check_on_window_create(mut self) -> Self {
        self.skip_check_on_window_create = true;
        self
    }

    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        let skip_check_on_window_create = self.skip_check_on_window_create;
        PluginBuilder::new("window-state")
            .setup(|app| {
                let cache: Arc<Mutex<HashMap<String, WindowMetadata>>> = if let Some(app_dir) =
                    app.path_resolver().app_dir()
                {
                    let state_path = app_dir.join(STATE_FILENAME);
                    if state_path.exists() {
                        Arc::new(Mutex::new(
                            tauri::api::file::read_binary(state_path)
                                .map_err(Error::TauriApi)
                                .and_then(|state| bincode::deserialize(&state).map_err(Into::into))
                                .unwrap_or_default(),
                        ))
                    } else {
                        Default::default()
                    }
                } else {
                    Default::default()
                };
                app.manage(WindowStateCache(cache));
                Ok(())
            })
            .on_webview_ready(move |window| {
                if !skip_check_on_window_create {
                    let _ = window.restore_state();
                }

                let cache = window.state::<WindowStateCache>();
                let cache = cache.0.clone();
                let label = window.label().to_string();
                let window_clone = window.clone();
                window.on_window_event(move |e| match e {
                    WindowEvent::Moved(position) => {
                        let mut c = cache.lock().unwrap();
                        if let Some(state) = c.get_mut(&label) {
                            let is_maximized = window_clone.is_maximized().unwrap_or(false);
                            state.maximized = is_maximized;

                            if let Some(monitor) = window_clone.current_monitor().unwrap() {
                                let monitor_position = monitor.position();
                                // save only window positions that are inside the current monitor
                                if position.x > monitor_position.x
                                    && position.y > monitor_position.y
                                    && !is_maximized
                                {
                                    state.x = position.x;
                                    state.y = position.y;
                                };
                            };
                        }
                    }
                    WindowEvent::Resized(size) => {
                        let mut c = cache.lock().unwrap();
                        if let Some(state) = c.get_mut(&label) {
                            let is_maximized = window_clone.is_maximized().unwrap_or(false);
                            state.maximized = is_maximized;

                            // It doesn't make sense to save a window with 0 height or width
                            if size.width > 0 && size.height > 0 && !is_maximized {
                                state.width = size.width;
                                state.height = size.height;
                            }
                        }
                    }
                    WindowEvent::CloseRequested { .. } => {
                        let mut c = cache.lock().unwrap();
                        if let Some(state) = c.get_mut(&label) {
                            state.visible = window_clone.is_visible().unwrap_or(true);
                        }
                    }
                    _ => {}
                });
            })
            .on_event(|app, event| match event {
                RunEvent::Exit | RunEvent::ExitRequested { .. } => {
                    let _ = app.save_window_state();
                }
                _ => {}
            })
            .build()
    }
}
