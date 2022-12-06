<template>
    <v-card v-if="!market.marketReady">
        <template v-if="market.marketLoading">
            <v-card-title class="align-start">
                <span class="font-weight-semibold">Market loading...</span>
            </v-card-title>
            <v-card-text>&nbsp;</v-card-text>
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
        <v-card-title class="align-start">
            <span class="font-weight-semibold">{{ market.marketTitle }}</span>
        </v-card-title>
        <v-card-subtitle class="mb-0 mt-n5">
            <span class="font-weight-semibold text--primary me-1">AquaDEX protocol</span>
            <span>Solana blockchain</span>
        </v-card-subtitle>
        <v-card-text>
            <v-row>
                <v-col v-for="data in statisticsData" :key="data.title" cols="6" md="6" class="d-flex align-center">
                    <v-avatar size="44" :color="resolveStatisticsIconVariation (data.title).color" rounded class="elevation-1">
                        <v-icon dark color="white" size="30">
                            {{ resolveStatisticsIconVariation (data.title).icon }}
                        </v-icon>
                    </v-avatar>
                    <div class="ms-3">
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
import { watch, toRefs, ref } from '@vue/composition-api'
import $solana from '@/atellix/solana-client'
import { PublicKey } from '@solana/web3.js'
import { DateTime } from 'luxon'

export default {
    props: ['market'],
    setup(props) {
        const { market } = toRefs(props)
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
            if (data === 'Last Trade') return { icon: mdiClockCheckOutline, color: 'success' }
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
