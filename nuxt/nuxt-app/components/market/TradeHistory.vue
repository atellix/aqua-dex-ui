<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Trade History</span>
        </v-card-title>
        <template v-if="showHistory">
            <v-simple-table dense :height="55 + (43 * (tradeList.length == 0 ? 1 : tradeList.length))">
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
                                Net&nbsp;Price
                            </th>
                            <th>
                                Fee
                            </th>
                            <th>
                                Rebate
                            </th>
                            <th>
                                &nbsp;
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="tradeList.length == 0" class="orderbook-row">
                            <td class="text-center" colspan="7"><em>(None)</em></td>
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
                            <td>
                                <template v-if="trade.role == 'maker'">
                                    {{ (new Number(trade.data.makerRebate / market.prcTokenScale)).toFixed(4) }}
                                </template>
                                <template v-else>
                                    {{ (new Number(0)).toFixed(4) }}
                                </template>
                            </td>
                            <td>
                                <a :href="trade.link" target="_blank"><v-icon size="20">
                                    {{ icons.mdiLinkBoxVariantOutline }}
                                </v-icon></a>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
            <div class="text-center">
                <v-pagination v-model="currentPage" :length="totalPages" :total-visible="7"></v-pagination>
            </div>
        </template>
    </v-card>
</template>

<script>
// eslint-disable-next-line object-curly-newline
import { mdiLinkBoxVariantOutline } from '@mdi/js'
import { ref, toRefs, watch } from '@vue/composition-api'
import { DateTime } from 'luxon'
import axios from 'axios'

const production = true

export default {
    props: ['market', 'events'],
    //components: {},
    setup(props, context) {
        const { market, events } = toRefs(props)

        const totalPages = ref(1)
        const currentPage = ref(1)
        const showHistory = ref(false)
        const tradeList = ref([])
        const baseURL = 'https://' + document.location.host + '/v1/'
        const loadLastTx = async (market, user) => {
            var url = baseURL + 'last_tx'
            var res = await axios.post(url, JSON.stringify({
                'market': market,
                'user': user,
            }), { 'Content-Type': 'application/json' })
            if (res.status === 200 && res.data.result === 'ok') {
                return res.data.lastTx
            }
            return ''
        }
        const loadTradeHistory = async (market, user, page) => {
            var url = baseURL + 'trades'
            var res = await axios.post(url, JSON.stringify({
                'market': market,
                'user': user,
                'page': page,
            }), { 'Content-Type': 'application/json' })
            var result = []
            var limit = 10
            if (res.status === 200 && res.data.result === 'ok') {
                totalPages.value = Math.floor(res.data.count / limit)
                if (res.data.count % limit !== 0) {
                    totalPages.value = totalPages.value + 1
                }
                for (var i = 0; i < res.data.trades.length; i++) {
                    var item = res.data.trades[i]
                    var lastDt = DateTime.fromISO(item.ts)
                    item.ts = lastDt.toLocaleString(DateTime.DATETIME_SHORT)
                    item.link = 'https://explorer.solana.com/tx/' + item.sig
                    if (!production) {
                        item.link = item.link + '?cluster=devnet'
                    }
                    result.push(item)
                }
            }
            return result
        }

        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                showHistory.value = true
                var mkt = current[0].marketAddr
                var user = current[0].userWallet
                tradeList.value = await loadTradeHistory(mkt, user, currentPage.value)
                var lastTx = await loadLastTx(mkt, user)
                setInterval(async () => {
                    var nextTx = await loadLastTx(mkt, user)
                    if (nextTx !== lastTx) {
                        lastTx = nextTx
                        tradeList.value = await loadTradeHistory(mkt, user, currentPage.value)
                    }
                }, 60000)
            }
        })
        watch([currentPage], async (current, prev) => {
            if (market.value.marketReady) {
                var mkt = market.value.marketAddr
                var user = market.value.userWallet
                tradeList.value = await loadTradeHistory(mkt, user, current[0])
            }
        })
        events.value.on('refresh_trade_history', async () => {
            if (market.value.marketReady) {
                var mkt = market.value.marketAddr
                var user = market.value.userWallet
                tradeList.value = await loadTradeHistory(mkt, user, currentPage.value)
            }
        })

        return {
            currentPage,
            totalPages,
            showHistory,
            tradeList,

            icons: {
                mdiLinkBoxVariantOutline,
            },
        }
    },
}
</script>
