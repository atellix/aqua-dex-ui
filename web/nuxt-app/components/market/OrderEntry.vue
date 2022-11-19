<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Trade</span>
        </v-card-title>
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
                            Bid on market tokens for purchase: MKT
                            <form>
                                <v-radio-group v-model="matchType" row class="mt-0 mb-3" hide-details>
                                    <v-radio value="limit" label="Limit Order"></v-radio>
                                    <v-radio value="market" label="Market Order"></v-radio>
                                </v-radio-group>
                                <template v-if="matchType == 'limit'">
                                    <v-select v-model="fillType" :items="fillTypeSelect" label="Filling & Posting Mode"></v-select>
                                    <v-text-field v-model="limitBidPrice" outlined dense persistent-hint label="Price"></v-text-field>
                                    <v-text-field v-model="limitBidQty" outlined dense persistent-hint label="Quantity"></v-text-field>
                                </template>
                                <template v-if="matchType == 'market'">
                                    <v-select v-model="marketOrderType" :items="marketOrderTypeSelect" label="Filling Mode"></v-select>
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
                            <v-btn color="primary">
                                Send Order
                            </v-btn>
                        </v-card-text>
                    </template>
                    <template v-else-if="item == 'Offer'">
                        <v-card-text>
                            Offer market tokens for sale: MKT
                        </v-card-text>
                        <v-card-text>
                            <v-btn color="primary">
                                Learn More
                            </v-btn>
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
    props: ['data', 'market'],
    setup(props) {
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
        return {
            marketOrderTypeSelect,
            marketOrderType,
            marketBidPrice,
            marketBidQty,
            limitBidPrice,
            limitBidQty,
            fillTypeSelect,
            fillType,
            matchType,
            tab: null,
            items: ['Bid', 'Offer'],
        }
    },
}
</script>
