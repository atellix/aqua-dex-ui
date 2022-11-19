<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Token Balances</span>
        </v-card-title>
        <v-card-text>
            <v-list class="pb-0">
                <v-list-item v-for="(data,index) in tokenList" :key="data.name" :class="`d-flex align-center px-0 ${index > 0 ? 'mt-4':''}`">
                    <v-avatar :color="data.color" size="40" :class="`${data.color} white--text font-weight-medium me-3`">
                        <span class="text-base">{{ data.abbr }}</span>
                    </v-avatar>
                    <div class="d-flex align-center flex-grow-1 flex-wrap">
                        <div class="me-2">
                            <div class="font-weight-semibold">
                                <span class="text--primary text-base me-1">{{ data.amount }}</span>
                                <!--<v-icon size="20" :color="data.change.charAt(0) === '+' ? 'success':'error'">
                                    {{ data.change.charAt(0) === '+' ? icons.mdiChevronUp: icons.mdiChevronDown }}
                                </v-icon>
                                <span :class="`text-xs ${data.change.charAt(0) === '+' ? 'success--text':'error--text'}`">{{ data.change.slice(1) }}</span>-->
                            </div>
                            <v-list-item-subtitle class="text-xs">
                                {{ data.name }}
                            </v-list-item-subtitle>
                        </div>
                        <v-spacer></v-spacer>
                        <div>
                            <h4>{{ data.symbol }}</h4>
                        </div>
                    </div>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<script>
import { watch, toRefs, ref } from '@vue/composition-api'
import { mdiDotsVertical, mdiChevronUp, mdiChevronDown } from '@mdi/js'

export default {
    props: ['data', 'market'],
    setup(props) {
        const { data, market } = toRefs(props)
        const tokenList = ref([
            {
                abbr: ' ',
                amount: ' ',
                name: 'Solana ◎',
                symbol: 'SOL',
                color: 'info',
                //change: '+25.8%',
            },
            {
                abbr: ' ',
                amount: ' ',
                name: 'USD Coin',
                symbol: 'USDC',
                color: 'success',
                //change: '-6.2%',
            },
        ])
 
        watch([data, market], (current, prev) => {
            if (current[1].marketReady) {
                var mktBal = new Number(current[0].mktTokenBalance / current[1].mktTokenScale)
                var prcBal = new Number(current[0].prcTokenBalance / current[1].prcTokenScale)
                mktBal = mktBal.toLocaleString(undefined, {
                    'minimumFractionDigits': current[1].mktTokenDecimals,
                    'maximumFractionDigits': current[1].mktTokenDecimals,
                })
                prcBal = prcBal.toLocaleString(undefined, {
                    'minimumFractionDigits': current[1].prcTokenDecimals,
                    'maximumFractionDigits': current[1].prcTokenDecimals,
                })
                var tkl = tokenList.value
                tkl[0]['amount'] = mktBal
                tkl[1]['amount'] = prcBal
            }
        })
        return {
            tokenList,
            icons: {
                mdiDotsVertical,
                mdiChevronUp,
                mdiChevronDown,
            },
        }
    },
}
</script>
