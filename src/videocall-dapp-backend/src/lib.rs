use ic_cdk::{init, post_upgrade, query, update};
use ic_websocket_cdk::{
    CanisterWsCloseArguments, CanisterWsCloseResult, CanisterWsGetMessagesArguments,
    CanisterWsGetMessagesResult, CanisterWsMessageArguments, CanisterWsMessageResult,
    CanisterWsOpenArguments, CanisterWsOpenResult, WsHandlers, WsInitParams,
};
use signaling::{on_close, on_message, on_open, SignalingMessage};

mod signaling;

#[init]
fn init() {
    let handlers = WsHandlers {
        on_open: Some(on_open),
        on_message: Some(on_message),
        on_close: Some(on_close),
    };

    let params = WsInitParams::new(handlers);

    ic_websocket_cdk::init(params);
}

#[post_upgrade]
fn post_upgrade() {
    // Reinitialization logic could be added here if needed
}

#[update]
fn ws_open(args: CanisterWsOpenArguments) -> CanisterWsOpenResult {
    ic_websocket_cdk::ws_open(args)
}

#[update]
fn ws_close(args: CanisterWsCloseArguments) -> CanisterWsCloseResult {
    ic_websocket_cdk::ws_close(args)
}

#[update]
fn ws_message(args: CanisterWsMessageArguments, msg: Option<SignalingMessage>) -> CanisterWsMessageResult {
    ic_websocket_cdk::ws_message(args, msg)
}

#[query]
fn ws_get_messages(args: CanisterWsGetMessagesArguments) -> CanisterWsGetMessagesResult {
    ic_websocket_cdk::ws_get_messages(args)
}

#[update]
fn start_call(callee: candid::Principal) -> Result<String, String> {
    let caller = ic_cdk::caller();
    if caller == callee {
        return Err("Cannot call yourself".to_string());
    }

    signaling::CALL_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        if sessions.contains_key(&caller) {
            return Err("Already in a call".to_string());
        }
        sessions.insert(caller, callee);
        Ok("Call initiated".to_string())
    })
}