use std::default::Default;

use serde::{Deserialize, Serialize};

use crate::pub_struct;

use super::super::super::utils;

#[derive(Debug, PartialEq, Deserialize, Serialize)]
pub struct SetActivityArgs {
    pub pid: u32,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub activity: Option<Activity>,
}

pub_struct!(ActivityTimestamps {
    start: u64,
    end: u64,
});

pub_struct!(ActivityParty {
    id: u32,
    size: (u32, u32),
});

pub_struct!(ActivityAssets {
    large_image: String,
    large_text: String,
    small_image: String,
    small_text: String,
});

pub_struct!(ActivitySecrets {
    join: String,
    spectate: String,
    game: String,
});

pub_struct!(ActivityButton {
    label: String,
    url: String,
});

pub_struct!(Activity {
    name: String,
    url: String,
    created_at: u64,
    timestamps: ActivityTimestamps,
    details: String,
    state: String,
    party: ActivityParty,
    assets: ActivityAssets,
    secrets: ActivitySecrets,
    instance: bool,
    buttons: Vec<ActivityButton>,
});

impl SetActivityArgs {
    pub fn new(f: Activity) -> Self {
        Self {
            pid: utils::pid(),
            activity: Some(f),
        }
    }
}

impl Default for SetActivityArgs {
    fn default() -> Self {
        Self {
            pid: utils::pid(),
            activity: None,
        }
    }
}
