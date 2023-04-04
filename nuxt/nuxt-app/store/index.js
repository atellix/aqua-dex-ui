export const state = () => ({
    device: {},
    wallet_connected: false,
    wallet_pubkey: '',
})

export const mutations = {
    setDevice(state, value) {
        state.device = value
    },
    setWallet(state, value) {
        state.wallet_connected = value.connected
        state.wallet_pubkey = value.pubkey
    }
}


