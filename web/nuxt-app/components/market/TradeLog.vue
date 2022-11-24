<template>
    <v-card>
        <v-data-table :headers="headers" :items="tradeList" :items-per-page="logMax" item-key="trade_id" class="table-rounded" hide-default-footer disable-sort dense>
            <template #[`item.price`]="{item}">
                {{ (new Number(item.price / market.prcTokenScale)).toFixed(4) }}
            </template>
            <template #[`item.amount`]="{item}">
                {{ (new Number(item.amount / market.mktTokenScale)).toFixed(2) }}
            </template>
            <template #[`item.maker`]="{item}">
                {{ item.maker.substring(0, 4) }}...{{ item.maker.substring(item.maker.length - 4, item.maker.length) }}
            </template>
            <template #[`item.taker`]="{item}">
                {{ item.taker.substring(0, 4) }}...{{ item.taker.substring(item.taker.length - 4, item.taker.length) }}
            </template>
            <template #[`item.taker_side`]="{item}">
                <template v-if="item.taker_side == 0">
                    <strong>Bid</strong>
                </template>
                <template v-else>
                    <strong>Offer</strong>
                </template>
            </template>
        </v-data-table>
    </v-card>
</template>

<script>
import { watch, toRefs, ref } from '@vue/composition-api'
import { mdiSquareEditOutline, mdiDotsVertical } from '@mdi/js'
import $solana from '@/atellix/solana-client'
import { DateTime } from 'luxon'

export default {
    props: ['market'],
    setup(props) {
        const { market } = toRefs(props)
        const tradeList = ref([])

        const updateLog = (logSpec) => {
            //console.log(logSpec)
            var list = []
            for (var i = 0; i < logSpec.logs.length; i++) {
                var item = logSpec.logs[i]
                item['maker'] = item['maker'].toString()
                item['taker'] = item['taker'].toString()
                var lastTs = new Date(item['ts'] * 1000)
                var lastDt = DateTime.fromJSDate(lastTs)
                item['ts'] = lastDt.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
                list.push(item)
            }
            tradeList.value = list
        }

        var logUpdates = false
        var logMax = 25
        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                var tradeLogPK = current[0].marketData.tradeLog
                var logInfo = await $solana.getAccountInfo(tradeLogPK)
                var logSpec = $solana.decodeTradeLog(logInfo.data, logMax)
                updateLog(logSpec)
                if (!logUpdates) {
                    logUpdates = true
                    $solana.provider.connection.onAccountChange(tradeLogPK, async (accountInfo, context) => {
                        var logUpdate = $solana.decodeTradeLog(accountInfo.data, logMax)
                        updateLog(logUpdate)
                    }) 
                }
            }
        })

        return {
            headers: [
                { text: 'Order', value: 'taker_side' },
                { text: 'Taker', value: 'taker' },
                { text: 'Maker', value: 'maker' },
                { text: 'Timestamp', value: 'ts' },
                { text: 'Quantity', value: 'amount' },
                { text: 'Price', value: 'price' },
            ],
            logMax,
            tradeList,
            // icons
            icons: {
                mdiSquareEditOutline,
                mdiDotsVertical,
            },
        }
    },
}
</script>
