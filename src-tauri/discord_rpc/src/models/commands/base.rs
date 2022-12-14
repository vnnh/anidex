use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::ChannelData;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "cmd")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventFunctionPayload {
    GetSelectedVoiceChannel {
        data: Option<ChannelData>,
    },

    /// Get the selected voice channel
    SelectVoiceChannel {
        data: ChannelData,
    },

    /// Subscribe
    Subscribe {
        data: HashMap<String, String>,
    },
    /// Dispatch
    Dispatch {
        data: HashMap<String, String>,
    },
}
