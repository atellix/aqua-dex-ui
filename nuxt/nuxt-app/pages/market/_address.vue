<template>
    <div>
        <v-row>
            <v-col cols="12" md="8">
                <v-row no-gutter>
                    <v-col cols="12">
                        <market-summary :market="marketSummary"></market-summary>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <chart-view :market="marketSummary"></chart-view>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <orderbook-view :market="marketSummary" :events="eventQueue"></orderbook-view>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <trade-log :market="marketSummary"></trade-log>
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="12" md="4">
                <v-row no-gutter>
                    <v-col cols="12">
                        <token-balances :market="marketSummary" :events="eventQueue" @settleTokens="settlementWithdraw" @createTokenAccount="createTokenAccount"></token-balances>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <order-entry :market="marketSummary" :events="eventQueue" @sendOrder="sendOrder"></order-entry>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <active-orders :market="marketSummary" :events="eventQueue" @cancelOrder="cancelOrder"></active-orders>
                    </v-col>
                </v-row>
                <v-row no-gutter>
                    <v-col cols="12">
                        <trade-history :market="marketSummary" :events="eventQueue"></trade-history>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
        <v-snackbar v-model="showAlert" :multiLine="true" :timeout="alertTimeout">
            {{ alertText }}
            <!--<template v-slot:action="{ attrs }">
                <v-btn color="red" text v-bind="attrs" @click="showAlert = false">Close</v-btn>
            </template>-->
        </v-snackbar>
    </div>
</template>

<script>
// eslint-disable-next-line object-curly-newline
import {
    mdiPoll,
    mdiLabelVariantOutline,
    mdiCurrencyUsd,
    mdiHelpCircleOutline,
} from "@mdi/js";
import { ref, onMounted } from '@vue/composition-api';
import { PublicKey } from '@solana/web3.js';
import $solana from '@/atellix/solana-client';
import Emitter from 'tiny-emitter';
import axios from 'axios';
import bs58 from 'bs58';

import MarketSummary from "@/components/market/MarketSummary.vue";
import ChartView from "@/components/market/ChartView.vue";
import OrderbookView from "@/components/market/OrderbookView.vue";
import TokenBalances from "@/components/market/TokenBalances.vue";
import ActiveOrders from "@/components/market/ActiveOrders.vue";
import OrderEntry from "@/components/market/OrderEntry.vue";
import TradeLog from "@/components/market/TradeLog.vue";
import TradeHistory from "@/components/market/TradeHistory.vue";

const baseURL = 'https://aqua-dev1.atellix.net:8000/v1/'

export default {
    components: {
        MarketSummary,
        OrderbookView,
        TokenBalances,
        OrderEntry,
        ActiveOrders,
        ChartView,
        TradeLog,
        TradeHistory,
    },
    layout: "Content",
    head() {
        return {
            title: this.pageHead.pageTitle,
            /*meta:[
                { hid: 'description', name: 'description', content:  this.pageHead.description },
                { hid: 'og:title', property: 'og:title', content: this.pageHead.pageTitle },
                { hid: 'og:url', property: 'og:url', content: this.pageHead.pageUrl },
                { hid: 'og:description', property: 'og:description', content: this.pageHead.description },
                //{ hid: 'og:image', property: 'og:image', content: process.env.baseUrl + ogImage},
                
                // twitter card
                { hid: "twitter:title", name: "twitter:title", content: this.pageHead.pageTitle },
                { hid: "twitter:url", name: "twitter:url", content: this.pageHead.pageUrl },
                { hid: 'twitter:description', name: 'twitter:description', content: this.pageHead.description },
                //{ hid: "twitter:image", name: "twitter:image", content: process.env.baseUrl + ogImage},
            ],*/
            link: [
                { hid: "canonical", rel: "canonical", href: this.pageHead.pageUrl },
            ]
        }
    },
    setup(props, context) {
        const eventbus = new Emitter();
        const marketSummary = ref({
            'marketLoading': true
        });
        const pageHead = ref({
            'pageTitle': '',
            'pageUrl': window.location.href,
            //'pageImage': 
            'description': '',
        });
        const eventQueue = ref(new Emitter());
        const marketAccounts = ref({});
        const orderbookData = ref({});
        const walletConnected = ref(false);
        const walletProcessing = ref(false);
        const walletIcon = ref(false);
        const walletPubkey = ref(false);
        const showAlert = ref(false);
        const alertText = ref('');
        const alertTimeout = ref(-1);
        const route = context.root.$route;

        const getMarketMetadata = async (market) => {
            const url = baseURL + 'market_info';
            const res = await axios.post(url, JSON.stringify({
                'market': market,
            }), { 'Content-Type': 'application/json' });
            if (res.status === 200) {
                return res.data;
            } else {
                return {};
            }
        };

        onMounted(async () => {
            $solana.init();
            var wallets = $solana.getWallets();
            //console.log('Wallets', wallets);
            var walletAdapter;
            var walletAwait = new Promise((resolve) => {
                eventbus.on('WalletConnected', function (val) {
                    resolve(val);
                });
            });
            if (wallets.length > 0) {
                walletAdapter = wallets[0];
                walletAdapter.on('connect', function (publicKey) {
                    console.log('Connected to ' + publicKey.toBase58());
                    var walletStatus = {
                        'connnected': true,
                        'icon': walletAdapter.icon,
                        'pubkey': publicKey.toBase58(),
                    };
                    walletIcon.value = walletAdapter.icon;
                    walletConnected.value = true;
                    walletPubkey.value = publicKey.toBase58();
                    eventbus.emit('WalletConnected', true);
                });
                walletAdapter.on('disconnect', function () {
                    console.log('Disconnected');
                    var walletStatus = {
                        'connnected': false,
                    };
                    walletConnected.value = false;
                    eventbus.emit('WalletConnected', false);
                });
                (async function (x) {
                    await walletAdapter.connect();
                    await walletAdapter.connect(); // Need to call twice on iOS?
                })();
            }
            (async function (x) {
                var ready = await walletAwait;
                if (ready) {
                    console.log('Solana ready!');
                    $solana.getProvider(walletAdapter);
                    $solana.loadProgram('aqua-dex');
                    $solana.updateRegister(async (sig) => {
                        return true;
                    });
                    var marketAddr = route.params['address'];
                    if (marketAddr) {
                        var marketKeyData = bs58.decode(marketAddr);
                        if (marketKeyData.length === 32) {
                            var marketPK = new PublicKey(marketAddr);
                            var walletPK = new PublicKey(walletPubkey.value);
                            var marketData = await $solana.getAccountData('aqua-dex', 'market', marketPK);
                            //console.log(marketData);
                            var marketStateData = await $solana.getAccountData('aqua-dex', 'marketState', marketData.state);
                            //console.log(marketStateData);
                            const marketAgent = await $solana.programAddress([marketPK.toBuffer()], $solana.program['aqua-dex'].programId);
                            const marketAgentPK = new PublicKey(marketAgent.pubkey);
                            const tokenVault1 = await $solana.associatedTokenAddress(marketAgentPK, marketData.mktMint);
                            const tokenVault2 = await $solana.associatedTokenAddress(marketAgentPK, marketData.prcMint);
                            const userToken1 = await $solana.associatedTokenAddress(walletPK, marketData.mktMint);
                            const userToken2 = await $solana.associatedTokenAddress(walletPK, marketData.prcMint);
                            const marketMeta = await getMarketMetadata(marketAddr);
                            pageHead.value.pageTitle = marketMeta.name || 'SPL Token Swap Market';
                            marketAccounts.value = {
                                'market': marketPK,
                                'state': marketData.state,
                                'agent': marketAgentPK,
                                'user': walletPK,
                                'userMktToken': new PublicKey(userToken1.pubkey),
                                'userPrcToken': new PublicKey(userToken2.pubkey),
                                'mktVault': new PublicKey(tokenVault1.pubkey),
                                'prcVault': new PublicKey(tokenVault2.pubkey), 
                                'orders': marketData.orders,
                                'tradeLog': marketData.tradeLog,
                                'settleA': marketStateData.settleA,
                                'settleB': marketStateData.settleB,
                            };
                            marketSummary.value = {
                                'marketLoading': false,
                                'marketReady': true,
                                'marketTitle': marketMeta.name || 'SPL Token Swap Market',
                                'marketAddr': marketAddr,
                                'marketData': marketData,
                                'marketMeta': marketMeta,
                                'userWallet': walletPK,
                                'mktTokenLabel': marketMeta.metadata.marketToken.name || 'Market Token',
                                'prcTokenLabel': marketMeta.metadata.pricingToken.name || 'Pricing Token',
                                'mktTokenSymbol': marketMeta.metadata.marketToken.symbol || 'MKT',
                                'prcTokenSymbol': marketMeta.metadata.pricingToken.symbol || 'PRC',
                                'mktTokenDecimals': new Number(marketData.mktDecimals),
                                'prcTokenDecimals': new Number(marketData.prcDecimals),
                                'mktTokenScale': 10 ** new Number(marketData.mktDecimals),
                                'prcTokenScale': 10 ** new Number(marketData.prcDecimals),
                            };
                        }
                    }
                }
            })();
        });

        const timeout = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms, null));
        };
        const confirmTransaction = async (txid, wait) => {
            var diff;
            var start = new Date();
            do {
                var found = await $solana.provider.connection.getTransaction(txid, {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0,
                });
                if (found) {
                    return found;
                }
                var now = new Date();
                diff = wait - (Math.abs(start.getTime() - now.getTime()) / 1000);
                var sleep = Math.min(diff, 5);
                await timeout(sleep * 1000);
            } while (diff > 0)
            return null;
        }
        const sendOrder = async (orderSpec) => {
            try {
                alertTimeout.value = -1;
                alertText.value = 'Preparing to send order';
                showAlert.value = true;
                const txid = await $solana.sendOrder(marketAccounts.value, orderSpec);
                alertText.value = 'Processing order...';
                const result = await confirmTransaction(txid, 120);
                if (result && !result.meta.err) {
                    alertText.value = 'Order processed successfully';
                } else if (result) {
                    alertText.value = 'Order failed';
                } else {
                    alertText.value = 'Order timeout';
                }
                alertTimeout.value = 5000;
                eventQueue.value.emit('clear_order_entry');
                await timeout(10000);
                eventQueue.value.emit('refresh_trade_history');
            } catch (error) {
                alertText.value = 'Order cancelled';
                alertTimeout.value = 2000;
                console.log('Solana Transaction Failed:');
                console.log(error);
            }
        }
        const cancelOrder = async (cancelSpec) => {
            try {
                alertTimeout.value = -1;
                alertText.value = 'Preparing to cancel order';
                showAlert.value = true;
                const txid = await $solana.cancelOrder(marketAccounts.value, cancelSpec);
                alertText.value = 'Processing cancel order...';
                const result = await confirmTransaction(txid, 120);
                if (result && !result.meta.err) {
                    alertText.value = 'Cancel order processed successfully';
                } else if (result) {
                    alertText.value = 'Cancel order failed';
                } else {
                    alertText.value = 'Cancel order timeout';
                }
                alertTimeout.value = 5000;
            } catch (error) {
                alertText.value = 'Cancel order cancelled';
                alertTimeout.value = 2000;
                console.log('Solana Transaction Failed:');
                console.log(error);
            }
        }
        const settlementWithdraw = async (withdrawSpec) => {
            try {
                alertTimeout.value = -1;
                alertText.value = 'Preparing to withdraw';
                showAlert.value = true;
                const txid = await $solana.withdrawTokens(marketAccounts.value, withdrawSpec);
                alertText.value = 'Processing withdrawal...';
                const result = await confirmTransaction(txid, 120);
                if (result && !result.meta.err) {
                    alertText.value = 'Withdrawal processed successfully';
                } else if (result) {
                    alertText.value = 'Withdrawal failed';
                } else {
                    alertText.value = 'Withdrawal timeout';
                }
                alertTimeout.value = 5000;
            } catch (error) {
                alertText.value = 'Withdrawal cancelled';
                alertTimeout.value = 2000;
                console.log('Solana Transaction Failed:');
                console.log(error);
            }
        }
        const createTokenAccount = async (tokenType) => {
            var mint
            if (tokenType === 'market') {
                mint = marketSummary.value.marketData.mktMint
            } else {
                mint = marketSummary.value.marketData.prcMint
            }
            try {
                alertTimeout.value = -1;
                alertText.value = 'Preparing to create token account';
                showAlert.value = true;
                const txid = await $solana.createTokenAccount(mint, marketSummary.value.userWallet);
                alertText.value = 'Processing create token account...';
                marketSummary.value.marketReady = false
                const result = await confirmTransaction(txid, 120);
                marketSummary.value.marketReady = true
                if (result && !result.meta.err) {
                    alertText.value = 'Token account created successfully';
                } else if (result) {
                    alertText.value = 'Create token account failed';
                } else {
                    alertText.value = 'Create token account timeout';
                }
                alertTimeout.value = 5000;
                await timeout(3000);
                eventQueue.value.emit('refresh_token_list');
            } catch (error) {
                alertText.value = 'Create token account cancelled';
                alertTimeout.value = 2000;
                console.log('Solana Transaction Failed:');
                console.log(error);
            }
        }

        return {
            eventQueue,
            marketSummary,
            showAlert,
            alertText,
            alertTimeout,
            pageHead,
            sendOrder,
            cancelOrder,
            settlementWithdraw,
            createTokenAccount,
        };
    },
};
</script>
