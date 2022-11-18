<template>
    <v-row>
        <v-col cols="12" md="8">
            <dashboard-market-summary :data="marketSummary"></dashboard-market-summary>
        </v-col>
        <v-col cols="12" md="4">
            <dashboard-congratulation-john></dashboard-congratulation-john>
        </v-col>

        <v-col cols="12" md="8">
            <dashboard-weekly-overview></dashboard-weekly-overview>
        </v-col>
        <v-col cols="12" md="4">
            <dashboard-card-sales-by-countries></dashboard-card-sales-by-countries>
        </v-col>

        <v-col cols="12" md="8">
            <dashboard-card-deposit-and-withdraw></dashboard-card-deposit-and-withdraw>
        </v-col>
        <v-col cols="12" md="4">
            <dashboard-card-total-earning></dashboard-card-total-earning>
        </v-col>

        <v-col cols="12">
            <dashboard-datatable></dashboard-datatable>
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

// demos
import DashboardMarketSummary from "@/components/dashboard/DashboardMarketSummary.vue";

import DashboardCongratulationJohn from "@/components/dashboard/DashboardCongratulationJohn.vue";
import DashboardCardTotalEarning from "@/components/dashboard/DashboardCardTotalEarning.vue";
import DashboardCardDepositAndWithdraw from "@/components/dashboard/DashboardCardDepositAndWithdraw.vue";
import DashboardCardSalesByCountries from "@/components/dashboard/DashboardCardSalesByCountries.vue";
import DashboardWeeklyOverview from "@/components/dashboard/DashboardWeeklyOverview.vue";
import DashboardDatatable from "@/components/dashboard/DashboardDatatable.vue";

export default {
    components: {
        StatisticsCardVertical,
        DashboardCongratulationJohn,
        DashboardMarketSummary,
        DashboardCardTotalEarning,
        DashboardCardDepositAndWithdraw,
        DashboardCardSalesByCountries,
        DashboardWeeklyOverview,
        DashboardDatatable,
    },
    layout: "Content",
    setup(props, context) {
        const eventbus = new Emitter();
        const marketSummary = ref({});
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
                            console.log(marketData);
                            var marketStateData = await $solana.getAccountData('aqua-dex', 'marketState', marketData.state);
                            console.log(marketStateData);
                            var orderBook = await $solana.getAccountInfo(marketData.orders);
                            $solana.decodeOrderBook(orderBook.data);
                            marketSummary.value = {'market': true};
                            //marketSummary.value['summary'] = $solana.loadMarket(route.params['market'])
                        }
                    }
                }
            })();
        });

        return {
            marketSummary,
        };
    },
    /*async asyncData({ params, redirect }) {
        console.log('Market Address');
        console.log(params.address);
    },*/
};
</script>
