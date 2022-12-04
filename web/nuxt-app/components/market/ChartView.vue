<template>
    <v-card>
        <template v-if="showChart">
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

        const chartOptions = {
            chart: {
                type: 'candlestick',
                width: '100vw',
                toolbar: {
                    show: true
                },
            },
            xaxis: {
                type: 'datetime',
                range: (24 * 60 * 60 * 1000),
            },
            yaxis: {
                tooltip: {
                    enabled: true,
                },
            },
        }

        var chartData = ref([ { data: [] } ])
        var loadData = async (vr, cd, sc) => {
            var url = 'https://aqua-dev1.atellix.net:8000/v1/history'
            var res = await axios.post(url, {})
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
                vr.apexChart.updateSeries(cd.value)
            }
        }

        const viewRefs = context.refs
        onMounted(() => {
            setTimeout(() => {
                showChart.value = true
            }, 10)
        })

        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                var prcScale = current[0].prcTokenScale
                await loadData(viewRefs, chartData, prcScale)
                setInterval(async () => {
                    console.log('Reloading chart data')
                    await loadData(viewRefs, chartData, prcScale)
                }, 60000)
            }
        })

        return {
            showChart,
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
