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
                    <chart-view></chart-view>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <orderbook-view :data="orderbookData" :market="marketSummary"></orderbook-view>
                </v-col>
            </v-row>
            <!--<v-row no-gutter>
                <v-col cols="12">
                    <dashboard-datatable></dashboard-datatable>
                </v-col>
            </v-row>-->
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
import StatisticsCardVertical from "@/components/statistics-card/StatisticsCardVertical.vue";
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

// demos
import DashboardCongratulationJohn from "@/components/dashboard/DashboardCongratulationJohn.vue";
import DashboardDatatable from "@/components/dashboard/DashboardDatatable.vue";

export default {
    components: {
        MarketSummary,
        OrderbookView,
        TokenBalances,
        OrderEntry,
        ActiveOrders,
        ChartView,
        StatisticsCardVertical,
        DashboardCongratulationJohn,
        DashboardDatatable,
    },
    layout: "Content",
    setup(props, context) {
        const eventbus = new Emitter();
        const marketSummary = ref({});
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
                            var bookData = $solana.decodeOrderBook(orderBook.data);
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
                                'settleA': marketStateData.settleA,
                                'settleB': marketStateData.settleB,
                            };
                            marketSummary.value = {
                                'marketReady': true,
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
            console.log('Send Order:');
            console.log(orderSpec);
            console.log(await $solana.sendOrder(marketAccounts.value, orderSpec));
        }
        const cancelOrder = async (cancelSpec) => {
            console.log('Cancel Order:');
            console.log(cancelSpec);
            console.log(await $solana.cancelOrder(marketAccounts.value, cancelSpec));
        }
        const settlementWithdraw = async (withdrawSpec) => {
            console.log('Withdraw Tokens:');
            console.log(withdrawSpec);
            console.log(await $solana.withdrawTokens(marketAccounts.value, withdrawSpec));
        }

        return {
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
