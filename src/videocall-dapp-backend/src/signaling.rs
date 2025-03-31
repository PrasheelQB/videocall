use ic_cdk::println;
use ic_websocket_cdk::types::{ClientPrincipal, OnCloseCallbackArgs, OnMessageCallbackArgs, OnOpenCallbackArgs};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct SignalingMessage {
    pub to: Principal,
    pub kind: String, // "offer", "answer", "ice"
    pub data: Vec<u8>,
}

thread_local! {
    pub static CALL_SESSIONS: RefCell<HashMap<ClientPrincipal, ClientPrincipal>> = RefCell::new(HashMap::new());
    pub static PENDING_MESSAGES: RefCell<HashMap<ClientPrincipal, Vec<SignalingMessage>>> = RefCell::new(HashMap::new());
}

pub fn on_open(args: OnOpenCallbackArgs) {
    let client_principal = args.client_principal;
    println!("Client {} connected", client_principal);
    PENDING_MESSAGES.with(|pending| {
        let mut pending = pending.borrow_mut();
        if let Some(messages) = pending.remove(&client_principal) {
            for msg in messages {
                let _ = ic_websocket_cdk::send(client_principal, candid::encode_one(&msg).unwrap());
            }
        }
    });
}

pub fn on_message(args: OnMessageCallbackArgs) {
    let client_principal = args.client_principal;
    let msg: SignalingMessage = match candid::decode_one(&args.message) {
        Ok(msg) => msg,
        Err(e) => {
            println!("Failed to decode message from {}: {:?}", client_principal, e);
            return;
        }
    };

    println!("Received {} from {}", msg.kind, client_principal);

    CALL_SESSIONS.with(|sessions| {
        PENDING_MESSAGES.with(|pending| {
            let mut sessions = sessions.borrow_mut();
            let mut pending = pending.borrow_mut();
            let sender = client_principal;

            if msg.kind == "offer" {
                sessions.insert(sender, msg.to);
            }

            if ic_websocket_cdk::send(msg.to, candid::encode_one(&msg).unwrap()).is_ok() {
                println!("Sent {} to {}", msg.kind, msg.to);
            } else {
                pending.entry(msg.to).or_insert_with(Vec::new).push(msg.clone());
            }
        });
    });
}

pub fn on_close(args: OnCloseCallbackArgs) {
    let client_principal = args.client_principal;
    println!("Client {} disconnected", client_principal);
    CALL_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        sessions.remove(&client_principal);
    });
}