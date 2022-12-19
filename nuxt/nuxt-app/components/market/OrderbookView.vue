<template>
    <v-card>
        <v-card-text>
            <v-row no-gutters>
                <v-col cols="12" md="6">
                    <h3>Bids</h3>
                    <div style="border-right: thin solid rgba(0, 0, 0, 0.12); border-left: thin solid rgba(0, 0, 0, 0.12); border-bottom: thin solid rgba(0, 0, 0, 0.12);">
                        <v-simple-table dense v-if="orderbookData.bids">
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th class="text-right">
                                            Owner
                                        </th>
                                        <th class="text-right">
                                            Quantity
                                        </th>
                                        <th class="text-right">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="orderbookData.bids.length == 0" class="orderbook-row">
                                        <td class="text-center" colspan="3"><em>(None)</em></td>
                                    </tr>
                                    <tr v-for="item in orderbookData.bids" :key="item.key" class="orderbook-row">
                                        <td class="text-right">
                                            {{ item.owner.substring(0, 4) }}...{{ item.owner.substring(item.owner.length - 4, item.owner.length) }}
                                        </td>
                                        <td class="text-right">
                                            {{ (new Number(item.amount / market.mktTokenScale)).toFixed(2) }}
                                        </td>
                                        <td class="text-right">
                                            {{ (new Number(item.price / market.prcTokenScale)).toFixed(4) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </div>
                </v-col>
                <v-col cols="12" md="6">
                    <h3 class="ml-3">Offers</h3>
                    <div style="border-right: thin solid rgba(0, 0, 0, 0.12); border-left: thin solid rgba(0, 0, 0, 0.12); border-bottom: thin solid rgba(0, 0, 0, 0.12);">
                        <v-simple-table dense v-if="orderbookData.asks">
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th class="text-left">
                                            Price
                                        </th>
                                        <th class="text-left">
                                            Quantity
                                        </th>
                                        <th class="text-left">
                                            Owner
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="orderbookData.asks.length == 0" class="orderbook-row">
                                        <td class="text-center" colspan="3"><em>(None)</em></td>
                                    </tr>
                                    <tr v-for="item in orderbookData.asks" :key="item.key" class="orderbook-row">
                                        <td class="text-left">
                                            {{ (new Number(item.price / market.prcTokenScale)).toFixed(4) }}
                                        </td>
                                        <td class="text-left">
                                            {{ (new Number(item.amount / market.mktTokenScale)).toFixed(2) }}
                                        </td>
                                        <td class="text-left">
                                            {{ item.owner.substring(0, 4) }}...{{ item.owner.substring(item.owner.length - 4, item.owner.length) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script>
import { ref, toRefs, watch } from '@vue/composition-api'
import $solana from '@/atellix/solana-client'

export default {
    props: ['market', 'events'],
    setup(props, context) {
        const { market, events } = toRefs(props)
        const orderbookData = ref({})

        var refresh = false
        const updateOrderbook = async (marketSpec) => {
            const orderBook = await $solana.getAccountInfo(marketSpec.marketData.orders)
            const bookData = $solana.decodeOrderBook(orderBook.data)
            const maxOrders = 10
            events.value.emit('update_orderbook', bookData)
            orderbookData.value = {
                'bids': (bookData.bids.length > maxOrders) ? bookData.bids.slice(0, maxOrders) : bookData.bids,
                'asks': (bookData.asks.length > maxOrders) ? bookData.asks.slice(0, maxOrders) : bookData.asks,
            }
            console.log('Orderbook loaded')
            if (!refresh) {
                refresh = true
                $solana.provider.connection.onAccountChange(marketSpec.marketData.orders, (accountInfo, context) => {
                    const bookUpdate = $solana.decodeOrderBook(accountInfo.data)
                    events.value.emit('update_orderbook', bookUpdate)
                    orderbookData.value = {
                        'bids': (bookUpdate.bids.length > maxOrders) ? bookUpdate.bids.slice(0, maxOrders) : bookUpdate.bids,
                        'asks': (bookUpdate.asks.length > maxOrders) ? bookUpdate.asks.slice(0, maxOrders) : bookUpdate.asks,
                    }
                    console.log('Orderbook updated')
                })
            }
        }

        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                await updateOrderbook(current[0])
            }
        })

        return {
            orderbookData
        }
    }
}
</script>

