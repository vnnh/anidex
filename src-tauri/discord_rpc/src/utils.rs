use crate::Result;
use serde_json::Value;
use std::convert::TryInto;
use std::env::var;
use std::path::Path;
use std::path::PathBuf;
use uuid::Uuid;

#[allow(unused)]
pub fn pid() -> u32 {
    std::process::id()
}

pub fn nonce() -> String {
    Uuid::new_v4().to_string()
}

pub fn create_json(value: &mut serde_json::Value) -> Result<String> {
    let uuid = nonce();

    let payload = value.as_object_mut().expect("payload must be an object");
    payload.insert("nonce".to_string(), Value::String(uuid));

    // TODO: handle error
    Ok(serde_json::to_string(&payload)?)
}

// Re-implement some packing methods in Rust
pub fn pack(opcode: u32, data_len: u32) -> Result<Vec<u8>> {
    let mut bytes = Vec::new();

    for byte_array in &[opcode.to_le_bytes(), data_len.to_le_bytes()] {
        bytes.extend_from_slice(byte_array);
    }

    Ok(bytes)
}

pub fn unpack(data: Vec<u8>) -> Result<(u32, u32)> {
    let data = data.as_slice();
    let (opcode, header) = data.split_at(std::mem::size_of::<u32>());

    let opcode = u32::from_le_bytes(opcode.try_into()?);
    let header = u32::from_le_bytes(header.try_into()?);

    Ok((opcode, header))
}

const ENV_KEYS: [&str; 4] = ["XDG_RUNTIME_DIR", "TMPDIR", "TMP", "TEMP"];

/// returns the path of the temp dir on a unix system
pub fn temp_directory() -> PathBuf {
    let mut path = String::new();

    for key in &ENV_KEYS {
        match var(key) {
            Ok(val) => {
                path = val;
                break;
            }
            Err(_e) => continue,
        }
    }
    PathBuf::from(path)
}

/// iterate over 0-10 index and check if files exists then return the path
pub fn get_pipe_pattern() -> PathBuf {
    for i in 0..10 {
        #[cfg(target_os = "windows")]
        let path = format!(r"\\?\pipe\discord-ipc-{}", i);

        #[cfg(target_family = "unix")]
        let path = temp_directory().join(format!("discord-ipc-{}", i));

        if Path::new(&path).exists() {
            return Path::new(&path).to_path_buf();
        }
    }
    panic!("Could not find discord-ipc-0");
}
