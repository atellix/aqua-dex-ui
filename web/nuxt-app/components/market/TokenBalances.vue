<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Balances</span>
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
import { PublicKey } from '@solana/web3.js'
import $solana from '@/atellix/solana-client'

export default {
    props: ['data', 'market'],
    setup(props) {
        const { market } = toRefs(props)
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

        const updateBalance = async (mint, wallet, scale, decimals, idx) => {
            var tokens = await $solana.getTokenBalance(mint, wallet)
            console.log(mint.toString() + ' ' + tokens + ' ' + scale + ' ' + decimals)
            var bal = new Number(tokens / scale)
            bal = bal.toLocaleString(undefined, {
                'minimumFractionDigits': decimals,
                'maximumFractionDigits': decimals,
            })
            var tkl = tokenList.value
            tkl[idx]['amount'] = bal
            return true
        }
 
        var tokenUpdates = false
        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                var marketData = current[0].marketData
                var walletPK = current[0].userWallet
                var mktScale = current[0].mktTokenScale
                var mktDecimals = current[0].mktTokenDecimals
                var prcScale = current[0].prcTokenScale
                var prcDecimals = current[0].prcTokenDecimals
                await Promise.all([
                    updateBalance(marketData.mktMint, walletPK, mktScale, mktDecimals, 0),
                    updateBalance(marketData.prcMint, walletPK, prcScale, prcDecimals, 1),
                ])
                if (!tokenUpdates) {
                    tokenUpdates = true
                    const userToken1 = await $solana.associatedTokenAddress(walletPK, marketData.mktMint)
                    const userToken2 = await $solana.associatedTokenAddress(walletPK, marketData.prcMint)
                    $solana.provider.connection.onAccountChange(new PublicKey(userToken1.pubkey), async (accountInfo, context) => {
                        await updateBalance(marketData.mktMint, walletPK, mktScale, mktDecimals, 0)
                    }); 
                    $solana.provider.connection.onAccountChange(new PublicKey(userToken2.pubkey), async (accountInfo, context) => {
                        await updateBalance(marketData.prcMint, walletPK, prcScale, prcDecimals, 1)
                    }); 
                }
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
