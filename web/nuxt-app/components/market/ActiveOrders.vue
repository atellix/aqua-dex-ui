<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Orders</span>
        </v-card-title>
        <v-card-text>
            <v-list class="pb-0" v-if="orderList.length > 0">
                <div v-for="(data,index) in orderList" :key="data.key">
                    <v-list-item :class="`d-flex align-center px-0 ${index > 0 ? 'mt-4':''}`">
                        <template v-if="data.image">
                            <v-avatar size="25" class="me-3">
                                <img :src="data.image" :alt="data.symbol"/>
                            </v-avatar>
                        </template>
                        <template v-else>
                            <v-avatar :color="data.color" size="25" :class="`${data.color} white--text font-weight-medium me-3`">
                                <span class="text-base">{{ data.abbr }}</span>
                            </v-avatar>
                        </template>
                        <div class="d-flex align-center flex-grow-1 flex-wrap">
                            <div class="me-2">
                                <div class="font-weight-semibold">
                                    <span class="text--primary text-base me-1">{{ data.amount }}</span>
                                </div>
                                <v-list-item-subtitle class="text-xs">
                                    {{ data.name }}
                                </v-list-item-subtitle>
                            </div>
                            <v-spacer></v-spacer>
                            <div>
                                <h4>{{ data.symbol }}</h4>
                            </div>
                            <v-btn icon @click="showCancel = (showCancel == data.key) ? '' : data.key">
                                <v-icon>{{ showCancel != data.key ? icons.mdiChevronUp : icons.mdiChevronDown }}</v-icon>
                            </v-btn>
                        </div>
                    </v-list-item>
                    <v-expand-transition>
                        <v-list-item v-if="showCancel == data.key" :class="`d-flex align-center px-0 ${index > 0 ? 'mt-4':''}`">
                            <v-card-text class="mb-0">
                                <v-btn @click="cancelOrder(data.key, data.side)" text color="error">Cancel Order</v-btn>
                            </v-card-text>
                        </v-list-item>
                    </v-expand-transition>
                </div>
            </v-list>
            <p v-else class="mb-0 text-center">
                <em>No Orders</em>
            </p>
        </v-card-text>
    </v-card>
</template>

<script>
import { watch, toRefs, ref } from '@vue/composition-api'
import { mdiDotsVertical, mdiChevronUp, mdiChevronDown } from '@mdi/js'

export default {
    props: ['market', 'events'],
    setup(props, context) {
        const { market, events } = toRefs(props)
        const showCancel = ref('')
        const orderList = ref([])
 
        events.value.on('update_orderbook', (orderbookData) => {
            //console.log('Orderbook update hook')
            var user = market.value.userWallet.toString()
            var orderMap = {}
            var orderItems = []
            var i
            for (i = 0; i < orderbookData.bids.length; i++) {
                var order = orderbookData.bids[i]
                if (order.owner === user) {
                    orderMap[order.key] = order
                    orderItems.push(order.key)
                }
            }
            for (i = 0; i < orderbookData.asks.length; i++) {
                var order = orderbookData.asks[i]
                if (order.owner === user) {
                    orderMap[order.key] = order
                    orderItems.push(order.key)
                }
            }
            var itemList = []
            for (i = 0; i < orderItems.length; i++) {
                var k = orderItems[i]
                var order = orderMap[k]
                var quantity = (new Number(order.amount / market.value.mktTokenScale)).toFixed(2)
                var price = (new Number(order.price / market.value.prcTokenScale)).toFixed(4)
                var item = {
                    'key': order.key,
                    'abbr': ' ',
                    'amount': quantity + ' @ ' + price,
                }
                if (order.type === 'bid') {
                    var total = new Number(order.amount / market.value.mktTokenScale)
                    total = total * new Number(order.price / market.value.prcTokenScale)
                    item['name'] = 'Bid'
                    item['side'] = 'bid'
                    item['color'] = 'success'
                    item['symbol'] = total.toFixed(2) + ' ' + market.value.prcTokenSymbol
                    if (market.value.marketMeta.metadata.pricingToken.image) {
                        item['image'] = market.value.marketMeta.metadata.pricingToken.image
                    }
                } else if (order.type === 'ask') {
                    var total = new Number(order.amount / market.value.mktTokenScale)
                    item['name'] = 'Offer'
                    item['side'] = 'ask'
                    item['color'] = 'info'
                    item['symbol'] = total.toFixed(2) + ' ' + market.value.mktTokenSymbol
                    if (market.value.marketMeta.metadata.marketToken.image) {
                        item['image'] = market.value.marketMeta.metadata.marketToken.image
                    }
                }
                itemList.push(item)
            }
            orderList.value = itemList
        })
        const cancelOrder = (orderId, orderType) => {
            context.emit('cancelOrder', {'orderId': orderId, 'orderType': orderType})
        }

        return {
            orderList,
            showCancel,
            cancelOrder,
            icons: {
                mdiDotsVertical,
                mdiChevronUp,
                mdiChevronDown,
            },
        }
    },
}
</script>
