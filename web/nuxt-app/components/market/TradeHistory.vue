<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Trade History</span>
        </v-card-title>
        <template v-if="showHistory">
            <v-simple-table dense>
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th>
                                Timestamp
                            </th>
                            <th>
                                Action
                            </th>
                            <th>
                                Price
                            </th>
                            <th>
                                Quantity
                            </th>
                            <th>
                                Net
                            </th>
                            <th>
                                Fee
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="tradeList.length == 0" class="orderbook-row">
                            <td class="text-center" colspan="3"><em>(None)</em></td>
                        </tr>
                        <tr v-for="trade in tradeList" :key="trade.data.tradeId" class="orderbook-row">
                            <td>
                                {{ trade.ts }}
                            </td>
                            <td>
                                <template v-if="trade.role == 'maker'">
                                    <template v-if="trade.data.takerSide == '0'">
                                        Sell
                                    </template>
                                    <template v-else>
                                        Buy
                                    </template>
                                </template>
                                <template v-else>
                                    <template v-if="trade.data.takerSide == '0'">
                                        Buy
                                    </template>
                                    <template v-else>
                                        Sell
                                    </template>
                                </template>
                            </td>
                            <td>
                                {{ (new Number(trade.data.price / market.prcTokenScale)).toFixed(4) }}
                            </td>
                            <td>
                                {{ (new Number(trade.data.amount / market.mktTokenScale)).toFixed(4) }}
                            </td>
                            <td>
                                {{ (new Number((trade.data.price / market.prcTokenScale) * (trade.data.amount / market.mktTokenScale))).toFixed(4) }}
                            </td>
                            <td>
                                <template v-if="trade.role == 'taker'">
                                    {{ (new Number(trade.data.takerFee / market.prcTokenScale)).toFixed(4) }}
                                </template>
                                <template v-else>
                                    {{ (new Number(0)).toFixed(4) }}
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </template>
    </v-card>
</template>

<script>
import { ref, toRefs, watch } from '@vue/composition-api'
import { DateTime } from 'luxon'
import axios from 'axios'

export default {
    props: ['market'],
    //components: {},
    setup(props, context) {
        const { market } = toRefs(props)

        const showHistory = ref(false)
        const tradeList = ref([])
        const loadLastTx = async (market, user) => {
            var url = 'https://aqua-dev1.atellix.net:8000/v1/last_tx'
            var res = await axios.post(url, JSON.stringify({
                'market': market,
                'user': user,
            }), { 'Content-Type': 'application/json' })
            if (res.status === 200 && res.data.result === 'ok') {
                return res.data.lastTx
            }
            return ''
        }
        const loadTradeHistory = async (market, user) => {
            var url = 'https://aqua-dev1.atellix.net:8000/v1/trades'
            var res = await axios.post(url, JSON.stringify({
                'market': market,
                'user': user,
            }), { 'Content-Type': 'application/json' })
            var result = []
            if (res.status === 200 && res.data.result === 'ok') {
                for (var i = 0; i < res.data.trades.length; i++) {
                    var item = res.data.trades[i]
                    var lastDt = DateTime.fromISO(item.ts)
                    item.ts = lastDt.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
                    result.push(item)
                }
            }
            return result
        }

        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                showHistory.value = true
                var market = current[0].marketAddr
                var user = current[0].userWallet
                tradeList.value = await loadTradeHistory(market, user)
                var lastTx = await loadLastTx(market, user)
                setInterval(async () => {
                    var nextTx = await loadLastTx(market, user)
                    if (nextTx !== lastTx) {
                        lastTx = nextTx
                        tradeList.value = await loadTradeHistory(market, user)
                    }
                }, 60000)
            }
        })

        return {
            showHistory,
            tradeList,
        }
    },
}
</script>
