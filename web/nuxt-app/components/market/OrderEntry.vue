<template>
    <v-card>
        <v-card>
            <v-tabs v-model="tab" class="tab-index">
                <v-tab v-for="item in items" :key="item">
                    {{ item }}
                </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item v-for="item in items" :key="item" class="mt-2">
                    <template v-if="item == 'Bid'">
                        <v-card-text>
                            <form>
                                <v-radio-group v-model="matchType" row class="mt-0 mb-3" hide-details>
                                    <v-radio value="limit" label="Limit Bid"></v-radio>
                                    <v-radio value="market" label="Market Bid"></v-radio>
                                </v-radio-group>
                                <template v-if="matchType == 'limit'">
                                    <v-select v-model="fillType" :items="fillTypeSelect" label="Fill Mode"></v-select>
                                    <v-text-field v-model="limitBidQty" outlined dense persistent-hint label="Bid Quantity"></v-text-field>
                                    <v-text-field v-model="limitBidPrice" outlined dense persistent-hint label="Bid Price"></v-text-field>
                                </template>
                                <template v-if="matchType == 'market'">
                                    <v-select v-model="marketOrderType" :items="marketOrderTypeSelect" label="Fill Mode"></v-select>
                                    <template v-if="marketOrderType == 'quantity' || marketOrderType == 'fill_quantity'">
                                        <v-text-field v-model="marketBidQty" outlined dense persistent-hint label="Quantity"></v-text-field>
                                    </template>
                                    <template v-else>
                                        <v-text-field v-model="marketBidPrice" outlined dense persistent-hint label="Net Price"></v-text-field>
                                    </template>
                                </template>
                                <!--<v-text-field v-model="name" label="Name" data-vv-name="name" required></v-text-field>-->
                            </form>
                        </v-card-text>
                        <v-card-text>
                            <v-btn @click="sendOrder" color="primary">Place Bid</v-btn>
                        </v-card-text>
                    </template>
                    <template v-else-if="item == 'Offer'">
                        <v-card-text>
                            <form>
                                <v-radio-group v-model="matchType" row class="mt-0 mb-3" hide-details>
                                    <v-radio value="limit" label="Limit Offer"></v-radio>
                                    <v-radio value="market" label="Market Offer"></v-radio>
                                </v-radio-group>
                                <template v-if="matchType == 'limit'">
                                    <v-select v-model="fillType" :items="fillTypeSelect" label="Fill Mode"></v-select>
                                    <v-text-field v-model="limitAskQty" outlined dense persistent-hint label="Offer Quantity"></v-text-field>
                                    <v-text-field v-model="limitAskPrice" outlined dense persistent-hint label="Offer Price"></v-text-field>
                                </template>
                                <template v-if="matchType == 'market'">
                                    <v-select v-model="marketOrderType" :items="marketOrderTypeSelect" label="Fill Mode"></v-select>
                                    <template v-if="marketOrderType == 'quantity' || marketOrderType == 'fill_quantity'">
                                        <v-text-field v-model="marketAskQty" outlined dense persistent-hint label="Quantity"></v-text-field>
                                    </template>
                                    <template v-else>
                                        <v-text-field v-model="marketAskPrice" outlined dense persistent-hint label="Net Price"></v-text-field>
                                    </template>
                                </template>
                            </form>
                        </v-card-text>
                        <v-card-text>
                            <v-btn @click="sendOrder" color="primary">Place Offer</v-btn>
                        </v-card-text>
                    </template>
                </v-tab-item>
            </v-tabs-items>
        </v-card>
    </v-card>
</template>

<script>
import { watch, toRefs, ref } from '@vue/composition-api'
import { mdiDotsVertical, mdiChevronUp, mdiChevronDown } from '@mdi/js'

export default {
    props: ['market', 'events'],
    setup(props, context) {
        const tab = ref(0)
        const matchType = ref('limit')
        const fillTypeSelect = ref([
            { 'value': 'post', 'text': 'Fill Any & Post Order' }, // Fill: false, Post: true
            { 'value': 'partial', 'text': 'Fill Any & Do Not Post' }, // Fill: false, Post: false
            { 'value': 'fill', 'text': 'Fill Entire Order or Cancel' }, // Fill: true, Post: false
        ])
        const fillType = ref('post')
        const marketOrderTypeSelect = ref([
            { 'value': 'quantity', 'text': 'Fill Any up to Quantity' },
            { 'value': 'net_price', 'text': 'Fill Any up to Net Price' },
            { 'value': 'fill_quantity', 'text': 'Fill Entire Quantity or Cancel' },
            { 'value': 'fill_net_price', 'text': 'Fill Entire Net Price or Cancel' },
        ])
        const marketOrderType = ref('quantity')
        const marketBidPrice = ref('')
        const marketBidQty = ref('')
        const limitBidPrice = ref('')
        const limitBidQty = ref('')
        const marketAskPrice = ref('')
        const marketAskQty = ref('')
        const limitAskPrice = ref('')
        const limitAskQty = ref('')

        props.events.once('clear_order_entry', () => {
            marketBidPrice.value = ''
            marketBidQty.value = ''
            limitBidPrice.value = ''
            limitBidQty.value = ''
            marketAskPrice.value = ''
            marketAskQty.value = ''
            limitAskPrice.value = ''
            limitAskQty.value = ''
        })
        const sendOrder = () => {
            var orderSpec = {}
            if (tab.value === 0) {
                orderSpec['orderType'] = 'bid'
                if (matchType.value === 'limit') {
                    orderSpec['matchType'] = 'limit'
                    if (fillType.value == 'post') {
                        orderSpec['postOrder'] = true
                        orderSpec['fillOrder'] = false
                    } else if (fillType.value == 'partial') {
                        orderSpec['postOrder'] = false
                        orderSpec['fillOrder'] = false
                    } else if (fillType.value == 'fill') {
                        orderSpec['postOrder'] = false
                        orderSpec['fillOrder'] = true
                    }
                    orderSpec['price'] = Math.floor((new Number(limitBidPrice.value)) * props.market.prcTokenScale)
                    orderSpec['quantity'] = Math.floor((new Number(limitBidQty.value)) * props.market.mktTokenScale)
                } else if (matchType.value === 'market') {
                    orderSpec['matchType'] = 'market'
                    if (marketOrderType.value === 'quantity' || marketOrderType.value === 'fill_quantity') {
                        orderSpec['byQuantity'] = true
                        if (marketOrderType.value === 'fill_quantity') {
                            orderSpec['fillOrder'] = true
                        } else {
                            orderSpec['fillOrder'] = false
                        }
                        orderSpec['quantity'] = Math.floor((new Number(marketBidQty.value)) * props.market.mktTokenScale)
                    } else if (marketOrderType.value === 'net_price' || marketOrderType.value === 'fill_net_price') {
                        orderSpec['byQuantity'] = false
                        if (marketOrderType.value === 'fill_net_price') {
                            orderSpec['fillOrder'] = true
                        } else {
                            orderSpec['fillOrder'] = false
                        }
                        orderSpec['netPrice'] = Math.floor((new Number(marketBidPrice.value)) * props.market.prcTokenScale)
                    }
                }
            } else if (tab.value === 1) {
                orderSpec['orderType'] = 'ask'
                if (matchType.value === 'limit') {
                    orderSpec['matchType'] = 'limit'
                    if (fillType.value == 'post') {
                        orderSpec['postOrder'] = true
                        orderSpec['fillOrder'] = false
                    } else if (fillType.value == 'partial') {
                        orderSpec['postOrder'] = false
                        orderSpec['fillOrder'] = false
                    } else if (fillType.value == 'fill') {
                        orderSpec['postOrder'] = false
                        orderSpec['fillOrder'] = true
                    }
                    orderSpec['price'] = Math.floor((new Number(limitAskPrice.value)) * props.market.prcTokenScale)
                    orderSpec['quantity'] = Math.floor((new Number(limitAskQty.value)) * props.market.mktTokenScale)
                } else if (matchType.value === 'market') {
                    orderSpec['matchType'] = 'market'
                    if (marketOrderType.value === 'quantity' || marketOrderType.value === 'fill_quantity') {
                        orderSpec['byQuantity'] = true
                        if (marketOrderType.value === 'fill_quantity') {
                            orderSpec['fillOrder'] = true
                        } else {
                            orderSpec['fillOrder'] = false
                        }
                        orderSpec['quantity'] = Math.floor((new Number(marketAskQty.value)) * props.market.mktTokenScale)
                    } else if (marketOrderType.value === 'net_price' || marketOrderType.value === 'fill_net_price') {
                        orderSpec['byQuantity'] = false
                        if (marketOrderType.value === 'fill_net_price') {
                            orderSpec['fillOrder'] = true
                        } else {
                            orderSpec['fillOrder'] = false
                        }
                        orderSpec['netPrice'] = Math.floor((new Number(marketAskPrice.value)) * props.market.prcTokenScale)
                    }
                }
            }
            context.emit('sendOrder', orderSpec)
        }
        return {
            marketOrderTypeSelect,
            marketOrderType,
            marketBidPrice,
            marketBidQty,
            limitBidPrice,
            limitBidQty,
            marketAskPrice,
            marketAskQty,
            limitAskPrice,
            limitAskQty,
            fillTypeSelect,
            fillType,
            matchType,
            sendOrder,
            tab,
            items: ['Bid', 'Offer'],
        }
    },
}
</script>
