<template>
    <v-card>
        <template v-if="showChart">
            <v-select v-model="chartView" :items="chartViewList" item-value="id" item-text="name" label="Candlesticks"/>
            <vue-apex-charts :options="chartOptions" :series="chartData" ref="apexChart"></vue-apex-charts>
        </template>
    </v-card>
</template>

<script>
import VueApexCharts from 'vue-apexcharts'
// eslint-disable-next-line object-curly-newline
import { mdiDotsVertical, mdiTrendingUp, mdiCurrencyUsd } from '@mdi/js'
import { ref, toRefs, watch, onMounted, getCurrentInstance } from '@vue/composition-api'
import axios from 'axios'

export default {
    props: ['market'],
    components: {
        VueApexCharts,
    },
    setup(props, context) {
        const { market } = toRefs(props)
        const ins = getCurrentInstance()?.proxy
        const $vuetify = ins && ins.$vuetify ? ins.$vuetify : null

        const showChart = ref(false)
        const chartRef = ref(null)

        const chartOptions = ref({
            chart: {
                type: 'candlestick',
                width: '100vw',
                toolbar: {
                    show: true
                },
            },
            xaxis: {
                type: 'datetime',
                range: (60 * 60 * 1000),
            },
            yaxis: {
                tooltip: {
                    enabled: true,
                },
            },
        })

        const chartData = ref([ { data: [] } ])
        const chartView = ref('v1m')
        const chartViewList = ref([
            {'id': 'v1m', 'name': '1 Min'},
            {'id': 'v3m', 'name': '3 Min'},
            {'id': 'v5m', 'name': '5 Min'},
            {'id': 'v15m', 'name': '15 Min'},
            {'id': 'v30m', 'name': '30 Min'},
            {'id': 'v1h', 'name': '1 Hr'},
            {'id': 'v2h', 'name': '2 Hr'},
            {'id': 'v4h', 'name': '4 Hr'},
            {'id': 'v6h', 'name': '6 Hr'},
            {'id': 'v8h', 'name': '8 Hr'},
            {'id': 'v12h', 'name': '12 Hr'},
            {'id': 'v1d', 'name': '1 Day'},
            {'id': 'v7d', 'name': '7 Day'},
            {'id': 'v30d', 'name': '30 Day'},
        ])
        const chartViewRange = {
            'v1m': (1000 * 60 * 60),
            'v3m': (1000 * 60 * 60 * 3),
            'v5m': (1000 * 60 * 60 * 6),
            'v15m': (1000 * 60 * 60 * 8),
            'v30m': (1000 * 60 * 60 * 12),
            'v1h': (1000 * 60 * 60 * 16),
            'v2h': (1000 * 60 * 60 * 24),
            'v4h': (1000 * 60 * 60 * 24),
            'v6h': (1000 * 60 * 60 * 48),
            'v8h': (1000 * 60 * 60 * 72),
            'v12h': (1000 * 60 * 60 * 72),
            'v1d': (1000 * 60 * 60 * 24 * 30),
            'v7d': (1000 * 60 * 60 * 24 * 30 * 6),
            'v30d': (1000 * 60 * 60 * 24 * 30 * 12),
        }
        const loadData = async (vr, cd, sc, m, v) => {
            console.log('Loading chart data: ' + m + ' ' + v)
            var url = 'https://aqua-dev1.atellix.net:8000/v1/history' // TODO: Make this a config var
            var res = await axios.post(url, JSON.stringify({
                'market': m,
                'view': v,
            }), { 'Content-Type': 'application/json' })
            if (res.status === 200 && res.data.result === 'ok') {
                var list = []
                for (var i = 0; i < res.data.history.length; i++) {
                    var cur = res.data.history[i]
                    var item = {
                        x: Date.parse(cur.x),
                        y: [
                            (new Number(cur.y[0])) / sc,
                            (new Number(cur.y[1])) / sc,
                            (new Number(cur.y[2])) / sc,
                            (new Number(cur.y[3])) / sc,
                        ]
                    }
                    list.push(item)
                }
                list.reverse()
                cd.value[0].data = list
                vr.apexChart.updateOptions({
                    xaxis: {
                        range: chartViewRange[v],
                    }
                })
                vr.apexChart.updateSeries(cd.value)
            }
        }

        const viewRefs = context.refs
        onMounted(() => {
            setTimeout(() => {
                showChart.value = true
            }, 10)
        })

        var ready = false
        var prcScale
        var marketAddr
        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                ready = true
                prcScale = current[0].prcTokenScale
                marketAddr = current[0].marketAddr
                await loadData(viewRefs, chartData, prcScale, marketAddr, chartView.value)
                setInterval(async () => {
                    await loadData(viewRefs, chartData, prcScale, marketAddr, chartView.value)
                }, 60000)
            }
        })

        watch([chartView], async (current, prev) => {
            if (ready) {
                console.log('Update chart view: ' + current[0])
                console.log(market)
                await loadData(viewRefs, chartData, prcScale, marketAddr, current[0])
            }
        })

        return {
            showChart,
            chartView,
            chartViewList,
            chartOptions,
            chartData,
            icons: {
                mdiDotsVertical,
                mdiTrendingUp,
                mdiCurrencyUsd,
            },
        }
    },
}
</script>
