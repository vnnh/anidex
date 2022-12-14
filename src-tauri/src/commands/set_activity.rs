use discord_rpc::{
    models::{
        commands::{Activity, ActivityAssets, ActivityButton, ActivityTimestamps, SetActivityArgs},
        rpc_command::RPCCommand,
    },
    DiscordIPCClient,
};
use futures::lock::Mutex;
use serde::Deserialize;
use tauri::State;

pub struct DiscordIntegrationState {
    pub discord_ipc_client: Mutex<Option<DiscordIPCClient>>,
}

impl Default for DiscordIntegrationState {
    fn default() -> Self {
        Self {
            discord_ipc_client: Default::default(),
        }
    }
}

#[derive(Deserialize)]
pub struct SetActivityPayload {
    pub animeTitle: String,
    pub animeEpisode: String,

    pub start: Option<u64>,
    pub end: Option<u64>,

    pub largeImage: Option<String>,
    pub largeImageText: Option<String>,

    pub smallImage: Option<String>,
    pub smallImageText: Option<String>,

    pub url: Option<String>,
}

pub async fn set_discord_activity(
    state: State<'_, DiscordIntegrationState>,
    payload: Option<SetActivityPayload>,
) -> bool {
    let mut ipc_client_guard = state.discord_ipc_client.lock().await;
    if ipc_client_guard.as_ref().is_none() {
        *ipc_client_guard = Some(
            DiscordIPCClient::new("1051728796149096458")
                .await
                .expect("Client failed to connect"),
        );
    }

    let ipc_client = ipc_client_guard.as_mut().unwrap();

    if payload.is_some() {
        let payload = payload.unwrap();
        let mut activity = Activity::new()
            .details(payload.animeTitle)
            .state(payload.animeEpisode)
            .instance(false);

        if payload.start.is_some() {
            activity = activity.timestamps(
                ActivityTimestamps::new()
                    .start(payload.start.unwrap())
                    .end(payload.end.unwrap()),
            );
        }

        if payload.largeImage.is_some() {
            activity = activity.assets(
                ActivityAssets::new()
                    .large_image(payload.largeImage.unwrap())
                    .large_text(payload.largeImageText.unwrap())
                    .small_image(payload.smallImage.unwrap())
                    .small_text(payload.smallImageText.unwrap()),
            );
        }

        if payload.url.is_some() {
            activity = activity.buttons(vec![ActivityButton::new()
                .label(String::from("Play"))
                .url(payload.url.unwrap())]);
        }

        ipc_client
            .emit_command(&RPCCommand::SetActivity(SetActivityArgs::new(activity)))
            .await
            .is_ok()
    } else {
        ipc_client
            .emit_command(&RPCCommand::SetActivity(SetActivityArgs::default()))
            .await
            .is_ok()
    }
}
