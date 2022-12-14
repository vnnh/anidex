use crate::create_json;
use crate::ipc_socket::DiscordIPCSocket;
use crate::models::events::EventPayload;
use crate::models::rpc_command::RPCCommand;
use crate::opcodes::OPCODES;
use crate::EventReceive;
use crate::Result;
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;

pub struct DiscordIPCClient {
    pub client_id: String,
    socket: DiscordIPCSocket,
}

#[derive(Serialize, Deserialize, Debug)]
struct OAuthRequest<'a> {
    client_id: &'a str,
    code: &'a str,
    grant_type: &'a str,
}

impl DiscordIPCClient {
    /// Creates a new `DiscordIPCClient`.
    ///
    /// # Examples
    /// ```
    /// let ipc_client = DiscordIPCClient::new("<some client id>")?;
    /// ```
    pub async fn new(client_id: &str) -> Result<Self> {
        let socket = DiscordIPCSocket::new().await?;

        let mut client = Self {
            client_id: client_id.to_string(),
            socket,
        };

        // connect to client
        client.connect().await?;

        Ok(client)
    }

    /// Connects the client to the Discord IPC.
    ///
    /// This method attempts to first establish a connection,
    /// and then sends a handshake.
    ///
    /// # Errors
    ///
    /// Returns an `Err` variant if the client
    /// fails to connect to the socket, or if it fails to
    /// send a handshake.
    ///
    /// # Examples
    /// ```
    /// let mut client = discord_ipc::new_client("<some client id>")?;
    /// client.connect()?;
    /// ```
    async fn connect(&mut self) -> Result<()> {
        println!("Connecting to client...");

        self.send_handshake().await?;

        // TODO: handle error
        let (_opcode, payload) = self.socket.recv().await.unwrap();

        // spooky line is not working
        let payload = serde_json::from_str(&payload)?;
        match payload {
            EventPayload::Ready { .. } => {
                println!("Connected to discord and got ready event!");
            }
            _ => {
                println!("Could not connect to discord...");
            }
        }

        Ok(())
    }

    /// Handshakes the Discord IPC.
    ///
    /// This method sends the handshake signal to the IPC.
    /// It is usually not called manually, as it is automatically
    /// called by [`connect`] and/or [`reconnect`].
    ///
    /// [`connect`]: #method.connect
    /// [`reconnect`]: #method.reconnect
    ///
    /// # Errors
    ///
    /// Returns an `Err` variant if sending the handshake failed.
    async fn send_handshake(&mut self) -> Result<()> {
        self.socket
            .send(
                &json!({
                  "v": 1,
                  "client_id": self.client_id
                })
                .to_string(),
                OPCODES::Handshake as u8,
            )
            .await?;

        // // TODO: Return an Err if the handshake is rejected
        // NOTE: this prolly shouldnt be done here as we dont want to consume messages here
        // self.recv()?;

        Ok(())
    }

    /// send a json string payload to the socket
    pub async fn emit_string(&mut self, payload: String) -> Result<()> {
        self.socket
            .send(&payload, OPCODES::Frame as u8)
            .await
            .unwrap();
        Ok(())
    }

    /// send a json string payload to the socket
    pub async fn emit_command(&mut self, command: &RPCCommand) -> Result<()> {
        let mut command_json = command.to_json()?;
        //println!("{}", command_json);
        let json_string = &create_json(&mut command_json)?;
        self.socket
            .send(json_string, OPCODES::Frame as u8)
            .await
            .unwrap();
        Ok(())
    }

    pub async fn handler<F>(&mut self, func: F)
    where
        F: Fn(EventReceive) + Send + Sync + 'static,
    {
        let mut socket_clone = self.socket.clone();
        tokio::spawn(async move {
            loop {
                let (_opcode, payload) = socket_clone.recv().await.unwrap();

                //println!("{}", &payload);
                match serde_json::from_str::<EventReceive>(&payload) {
                    Ok(e) => {
                        func(e);
                    }
                    Err(e) => {
                        println!("{:#?}", e);
                    }
                }
            }
        });
    }
}
