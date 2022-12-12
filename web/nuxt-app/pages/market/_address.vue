<template>
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
                    <orderbook-view :data="orderbookData" :market="marketSummary"></orderbook-view>
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
                    <token-balances :market="marketSummary" @settleTokens="settlementWithdraw"></token-balances>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <order-entry :market="marketSummary" @sendOrder="sendOrder"></order-entry>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <active-orders :market="marketSummary" :orders="orderbookData" @cancelOrder="cancelOrder"></active-orders>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <trade-history :market="marketSummary"></trade-history>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
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
import bs58 from 'bs58';

import MarketSummary from "@/components/market/MarketSummary.vue";
import ChartView from "@/components/market/ChartView.vue";
import OrderbookView from "@/components/market/OrderbookView.vue";
import TokenBalances from "@/components/market/TokenBalances.vue";
import ActiveOrders from "@/components/market/ActiveOrders.vue";
import OrderEntry from "@/components/market/OrderEntry.vue";
import TradeLog from "@/components/market/TradeLog.vue";
import TradeHistory from "@/components/market/TradeHistory.vue";

// demos
import DashboardCongratulationJohn from "@/components/dashboard/DashboardCongratulationJohn.vue";

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
        DashboardCongratulationJohn,
    },
    layout: "Content",
    head() {
        return {
            title: this.pageHead.pageTitle,
            meta:[
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
            ],
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
            'pageTitle': 'SOL / USDC (Dev)',
            'pageUrl': window.location.href,
            //'pageImage': 
            'description': 'Solana SPL Token swap market'
        });
        const marketAccounts = ref({});
        const orderbookData = ref({});
        const walletConnected = ref(false);
        const walletProcessing = ref(false);
        const walletIcon = ref(false);
        const walletPubkey = ref(false);
        const route = context.root.$route;

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
                            var orderBook = await $solana.getAccountInfo(marketData.orders);
                            var bookData = $solana.decodeOrderBook(orderBook.data, 10);
                            orderbookData.value = bookData;
                            $solana.provider.connection.onAccountChange(marketData.orders, (accountInfo, context) => {
                                orderbookData.value = $solana.decodeOrderBook(accountInfo.data);
                                console.log('Orderbook updated');
                            });
                            console.log('Orderbook loaded');
                            const marketAgent = await $solana.programAddress([marketPK.toBuffer()], $solana.program['aqua-dex'].programId)
                            const marketAgentPK = new PublicKey(marketAgent.pubkey)
                            const tokenVault1 = await $solana.associatedTokenAddress(marketAgentPK, marketData.mktMint)
                            const tokenVault2 = await $solana.associatedTokenAddress(marketAgentPK, marketData.prcMint)
                            const userToken1 = await $solana.associatedTokenAddress(walletPK, marketData.mktMint)
                            const userToken2 = await $solana.associatedTokenAddress(walletPK, marketData.prcMint)
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
                                'marketTitle': 'SOL/USDC',
                                'marketAddr': marketAddr,
                                'marketData': marketData,
                                'userWallet': walletPK,
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

        const sendOrder = async (orderSpec) => {
            try {
                console.log('Send Order:');
                console.log(orderSpec);
                console.log(await $solana.sendOrder(marketAccounts.value, orderSpec));
            } catch (error) {
                console.log('Solana Transaction Failed:');
                console.log(error)
            }
        }
        const cancelOrder = async (cancelSpec) => {
            try {
                console.log('Cancel Order:');
                console.log(cancelSpec);
                console.log(await $solana.cancelOrder(marketAccounts.value, cancelSpec));
            } catch (error) {
                console.log('Solana Transaction Failed:');
                console.log(error)
            }
        }
        const settlementWithdraw = async (withdrawSpec) => {
            try {
                console.log('Withdraw Tokens:');
                console.log(withdrawSpec);
                console.log(await $solana.withdrawTokens(marketAccounts.value, withdrawSpec));
            } catch (error) {
                console.log('Solana Transaction Failed:');
                console.log(error)
            }
        }

        return {
            pageHead,
            sendOrder,
            cancelOrder,
            settlementWithdraw,
            marketSummary,
            orderbookData,
        };
    },
    /*async asyncData({ params, redirect }) {
        console.log('Market Address');
        console.log(params.address);
    },*/
};
</script>
