<template>
    <v-row>
        <v-col cols="12" md="8">
            <v-row no-gutter>
                <v-col cols="12">
                    <market-summary :data="marketSummary"></market-summary>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <dashboard-weekly-overview></dashboard-weekly-overview>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <orderbook-view :data="orderbookData" :market="marketSummary"></orderbook-view>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <dashboard-datatable></dashboard-datatable>
                </v-col>
            </v-row>
        </v-col>
        <v-col cols="12" md="4">
            <v-row no-gutter>
                <v-col cols="12">
                    <token-balances :data="tokenBalanceList" :market="marketSummary"></token-balances>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <order-entry :data="tokenBalanceList" :market="marketSummary" @sendOrder="sendOrder"></order-entry>
                </v-col>
            </v-row>
            <v-row no-gutter>
                <v-col cols="12">
                    <active-orders :data="tokenBalanceList" :market="marketSummary"></active-orders>
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
import OrderbookView from "@/components/market/OrderbookView.vue";
import TokenBalances from "@/components/market/TokenBalances.vue";
import ActiveOrders from "@/components/market/ActiveOrders.vue";
import OrderEntry from "@/components/market/OrderEntry.vue";

// demos
import DashboardCongratulationJohn from "@/components/dashboard/DashboardCongratulationJohn.vue";
import DashboardCardTotalEarning from "@/components/dashboard/DashboardCardTotalEarning.vue";
import DashboardCardDepositAndWithdraw from "@/components/dashboard/DashboardCardDepositAndWithdraw.vue";
import DashboardWeeklyOverview from "@/components/dashboard/DashboardWeeklyOverview.vue";
import DashboardDatatable from "@/components/dashboard/DashboardDatatable.vue";

export default {
    components: {
        MarketSummary,
        OrderbookView,
        TokenBalances,
        OrderEntry,
        ActiveOrders,
        StatisticsCardVertical,
        DashboardCongratulationJohn,
        DashboardCardTotalEarning,
        DashboardCardDepositAndWithdraw,
        DashboardWeeklyOverview,
        DashboardDatatable,
    },
    layout: "Content",
    setup(props, context) {
        const eventbus = new Emitter();
        const marketSummary = ref({});
        const orderbookData = ref({});
        const tokenBalanceList = ref({
            'mktTokenBalance': '0',
            'prcTokenBalance': '0',
        });
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
                            var marketData = await $solana.getAccountData('aqua-dex', 'market', new PublicKey(marketAddr));
                            //console.log(marketData);
                            var marketStateData = await $solana.getAccountData('aqua-dex', 'marketState', marketData.state);
                            //console.log(marketStateData);
                            var orderBook = await $solana.getAccountInfo(marketData.orders);
                            var bookData = $solana.decodeOrderBook(orderBook.data);
                            orderbookData.value = bookData;
                            console.log('Orderbook loaded');
                            marketSummary.value = {
                                'market': true,
                                'marketReady': true,
                                'mktTokenDecimals': new Number(marketData.mktDecimals),
                                'prcTokenDecimals': new Number(marketData.prcDecimals),
                                'mktTokenScale': 10 ** new Number(marketData.mktDecimals),
                                'prcTokenScale': 10 ** new Number(marketData.prcDecimals),
                            };
                            tokenBalanceList.value = {
                                'mktTokenBalance': await $solana.getTokenBalance(marketData.mktMint, new PublicKey(walletPubkey.value)),
                                'prcTokenBalance': await $solana.getTokenBalance(marketData.prcMint, new PublicKey(walletPubkey.value)),
                            };
                            $solana.provider.connection.onAccountChange(marketData.orders, (accountInfo, context) => {
                                //console.log('Orderbook changed');
                                //console.log(accountInfo);
                                orderbookData.value = $solana.decodeOrderBook(accountInfo.data);
                                console.log('Orderbook updated');
                            });
                            //marketSummary.value['summary'] = $solana.loadMarket(route.params['market'])
                        }
                    }
                }
            })();
        });

        const sendOrder = async (orderSpec) => {
            console.log('Send Order:')
            console.log('Order Spec:')
            console.log(orderSpec)
        }

        return {
            sendOrder,
            marketSummary,
            orderbookData,
            tokenBalanceList,
        };
    },
    /*async asyncData({ params, redirect }) {
        console.log('Market Address');
        console.log(params.address);
    },*/
};
</script>
