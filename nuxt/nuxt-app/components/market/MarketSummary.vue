<template>
    <v-card v-if="!market.marketReady">
        <template v-if="market.marketLoading">
            <v-card-text>
                <div style="float: left;">Select a Solana wallet to connect.</div>
                <wallet-multi-button :wallets="wallets" autoConnect ref="mainWallet"/>
                <br clear="all"/>
            </v-card-text>
        </template>
        <template v-else>
            <v-card-title class="align-start">
                <span class="font-weight-semibold">Market Not Found</span>
            </v-card-title>
            <v-card-text>
                Please navigate to a valid market
            </v-card-text>
        </template>
    </v-card>
    <v-card v-else>
        <v-row no-gutters transition="slide-y-transition">
            <v-col cols="12" sm="6">
                <v-card-title class="align-start">
                    <span class="font-weight-semibold">{{ market.marketTitle }}</span>
                </v-card-title>
                <v-card-subtitle class="mb-n5 mt-n5">
                    <span class="font-weight-semibold text--primary me-1">AquaDEX protocol</span>
                    <span>Solana blockchain</span>
                    <p>
                        <strong>Fee:</strong> {{ (new Number(market.marketData.takerFee / 1000)).toFixed(1) }} bps
                        -
                        <strong>Rebate:</strong> {{ (new Number(market.marketData.makerRebate / 1000)).toFixed(1) }} bps
                    </p>
                </v-card-subtitle>
            </v-col>
            <v-col cols="12" sm="6">
                <div class="mt-4 mr-4">
                    <wallet-multi-button :wallets="wallets" autoConnect ref="mainWallet"/>
                </div>
            </v-col>
        </v-row>
        <v-card-text>
            <v-row no-gutters>
                <v-col v-for="data in statisticsData" :key="data.title" cols="12" sm="6" class="d-flex align-center">
                    <v-avatar size="44" :color="resolveStatisticsIconVariation (data.title).color" rounded class="elevation-1">
                        <v-icon dark color="white" size="30">
                            {{ resolveStatisticsIconVariation (data.title).icon }}
                        </v-icon>
                    </v-avatar>
                    <div class="ms-3 mb-3">
                        <p class="text-xs mb-0">{{ data.title }}</p>
                        <h4>{{ data.total }}</h4>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script>
// eslint-disable-next-line object-curly-newline
import { mdiClockCheckOutline, mdiCashCheck } from '@mdi/js'
import { onMounted, watch, toRefs, ref } from '@vue/composition-api'
import { WalletMultiButton } from 'solana-wallets-vue-2'
import { PublicKey } from '@solana/web3.js'
import { DateTime } from 'luxon'

import $solana from '@/atellix/solana-client'
import 'solana-wallets-vue-2/styles.css'

export default {
    props: ['market', 'events'],
    components: {
        WalletMultiButton
    },
    setup(props, context) {
        const { market, events } = toRefs(props)

        // Connect wallet
        const wallets = ref($solana.getWallets())
        const solanaInit = ref(true)
        
        onMounted(() => {
            watch(context.refs.mainWallet.walletStore, (current, prev) => {
                const connected = context.refs.mainWallet.walletStore.connected && !context.refs.mainWallet.walletStore.disconnecting
                if (solanaInit.value && current.connected) {
                    solanaInit.value = false
                    $solana.init()
                    $solana.getProvider(context.refs.mainWallet.walletStore)
                }
                context.root.$store.commit('setWallet', {
                    'connected': connected,
                    'pubkey': connected ? context.refs.mainWallet.walletStore.publicKey : '',
                })
                events.value.emit('wallet_connected', connected)
            })
        })

        const statisticsData = ref([
            {
                title: 'Last Price',
                total: '',
            },
            {
                title: 'Last Trade',
                total: '',
            },
        ])

        const resolveStatisticsIconVariation = data => {
            if (data === 'Last Price') return { icon: mdiCashCheck, color: 'primary' }
            if (data === 'Last Trade') return { icon: mdiClockCheckOutline, color: 'primary' }
            return { icon: mdiAccountOutline, color: 'success' }
        }

        const updateStats = (acctSpec) => {
            var lastTs = new Date(new Number(acctSpec.lastTs.toString()) * 1000)
            var lastDt = DateTime.fromJSDate(lastTs)
            var lastPrice = new Number(acctSpec.lastPrice.toString()) / props.market.prcTokenScale
            //var lastTs = new Date(new Number(acctSpec.lastTs.toString()))
            var sts = statisticsData.value
            sts[0]['total'] = lastPrice.toFixed(props.market.prcTokenDecimals)
            sts[1]['total'] = lastDt.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
        }

        var updateEvents = null
        watch(market, async (current, prev) => {
            if (current.marketReady) {
                if (!updateEvents) {
                    var marketStatePK = current.marketData.state
                    var startData = await $solana.program['aqua-dex'].account.marketState.fetch(marketStatePK)
                    updateStats(startData)
                    updateEvents = $solana.program['aqua-dex'].account.marketState.subscribe(marketStatePK)
                    updateEvents.on('change', (acctSpec) => {
                        updateStats(acctSpec)
                    })
                }
            }
        })

        return {
            wallets,
            statisticsData,
            resolveStatisticsIconVariation,

            // icons
            icons: {
                mdiClockCheckOutline,
                mdiCashCheck,
            },
        }
    },
}
</script>
<style lang="css">
.swv-dropdown {
    float: right;
}
.swv-dropdown-list {
    padding-left: 10px !important;
}
.swv-button {
    float: right;
}
.swv-button p {
    margin-bottom: 0 !important;
}
.swv-modal-list {
    padding-left: 0 !important;
}
</style>
