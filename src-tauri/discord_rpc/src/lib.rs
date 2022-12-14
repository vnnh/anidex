pub mod errors;
pub mod models;
pub mod opcodes;
pub mod utils;

mod ipc;
mod ipc_socket;

use errors::DiscordRPCError;
pub use ipc::DiscordIPCClient;
use models::{commands::EventFunctionPayload, events::EventPayload};
use serde::{Deserialize, Serialize};
pub use utils::*;

pub type Result<T, E = DiscordRPCError> = std::result::Result<T, E>;

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum EventReceive {
    Event(EventPayload),
    CommandReturn(EventFunctionPayload),
}
