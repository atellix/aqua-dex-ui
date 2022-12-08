<template>
    <v-card>
        <v-card-text>
            <v-row no-gutters>
                <v-col cols="12" md="6">
                    <h3>Bids</h3>
                    <div style="border-right: thin solid rgba(0, 0, 0, 0.12); border-left: thin solid rgba(0, 0, 0, 0.12); border-bottom: thin solid rgba(0, 0, 0, 0.12);">
                        <v-simple-table dense v-if="data.bids">
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
                                    <tr v-if="data.bids.length == 0" class="orderbook-row">
                                        <td class="text-center" colspan="3"><em>(None)</em></td>
                                    </tr>
                                    <tr v-for="item in data.bids" :key="item.key" class="orderbook-row">
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
                        <v-simple-table dense v-if="data.asks">
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
                                    <tr v-if="data.asks.length == 0" class="orderbook-row">
                                        <td class="text-center" colspan="3"><em>(None)</em></td>
                                    </tr>
                                    <tr v-for="item in data.asks" :key="item.key" class="orderbook-row">
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
export default {
    props: ['data', 'market'],
}
</script>

