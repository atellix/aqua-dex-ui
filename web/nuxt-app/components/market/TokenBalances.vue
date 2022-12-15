<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Balances</span>
        </v-card-title>
        <v-card-text>
            <v-list class="pb-0">
                <v-list-item v-for="(data, index) in tokenList" :key="index" :class="`d-flex align-center px-0 ${index > 0 ? 'mt-4':''}`">
                    <v-avatar :color="data.color" size="40" :class="`${data.color} white--text font-weight-medium me-3`">
                        <span class="text-base">{{ data.abbr }}</span>
                    </v-avatar>
                    <div class="d-flex align-center flex-grow-1 flex-wrap">
                        <div class="me-2">
                            <div v-if="data.create">
                                <v-btn @click="createTokenAccount(index)" text color="primary">Create Token Account</v-btn>
                            </div>
                            <div v-else class="font-weight-semibold">
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
                    </div>
                </v-list-item>
            </v-list>
            <template v-if="settleFunds.unsettled">
                <div class="mt-3">
                    <v-divider></v-divider>
                    <h3 class="mt-3">Unsettled Balances</h3>
                    <v-list class="pb-0 mb-0">
                        <template v-if="settleFunds.mktTokens">
                            <v-list-item class="d-flex align-center px-0">
                                <v-avatar color="info" size="25" class="info white--text font-weight-medium me-3">
                                    <span class="text-base"> </span>
                                </v-avatar>
                                <div class="d-flex align-center flex-grow-1 flex-wrap">
                                    <div class="me-2">
                                        <div class="font-weight-semibold">
                                            <span class="text--primary text-base me-1">{{ settleFunds.mktTokens }}</span>
                                        </div>
                                        <v-list-item-subtitle class="text-xs">
                                            {{ tokenList[0].name }}
                                        </v-list-item-subtitle>
                                    </div>
                                    <v-spacer></v-spacer>
                                    <div>
                                        <h4>{{ tokenList[0].symbol }}</h4>
                                    </div>
                                </div>
                            </v-list-item>
                        </template>
                        <template v-if="settleFunds.prcTokens">
                            <v-list-item class="d-flex align-center px-0">
                                <v-avatar color="success" size="25" class="success white--text font-weight-medium me-3">
                                    <span class="text-base"> </span>
                                </v-avatar>
                                <div class="d-flex align-center flex-grow-1 flex-wrap">
                                    <div class="me-2">
                                        <div class="font-weight-semibold">
                                            <span class="text--primary text-base me-1">{{ settleFunds.prcTokens }}</span>
                                        </div>
                                        <v-list-item-subtitle class="text-xs">
                                            {{ tokenList[1].name }}
                                        </v-list-item-subtitle>
                                    </div>
                                    <v-spacer></v-spacer>
                                    <div>
                                        <h4>{{ tokenList[1].symbol }}</h4>
                                    </div>
                                </div>
                            </v-list-item>
                        </template>
                    </v-list>
                    <v-btn @click="settleTokens" text color="info">Withdraw</v-btn>
                </div>
            </template>
        </v-card-text>
    </v-card>
</template>

<script>
import { watch, toRefs, ref } from '@vue/composition-api'
import { mdiDotsVertical, mdiChevronUp, mdiChevronDown } from '@mdi/js'
import { PublicKey } from '@solana/web3.js'
import $solana from '@/atellix/solana-client'

export default {
    props: ['data', 'market', 'events'],
    setup(props, context) {
        const { market, events } = toRefs(props)
        const settleFunds = ref({
            'unsettled': false,
            'mktTokens': '',
            'prcTokens': '',
        })
        const userVault = ref(null)
        const settleList = ref([])
        const tokenList = ref([
            {
                abbr: ' ',
                amount: ' ',
                name: ' ',
                symbol: ' ',
                color: 'info',
                create: false,
            },
            {
                abbr: ' ',
                amount: ' ',
                name: ' ',
                symbol: ' ',
                color: 'success',
                create: false,
            },
        ])

        const updateBalance = async (mint, wallet, scale, decimals, idx) => {
            var tkl = tokenList.value
            var tokens = await $solana.getTokenBalance(mint, wallet)
            if (tokens === '0') {
                var hasAccount = await $solana.hasTokenAccount(mint, wallet)
                //console.log('Has Account: ' + mint + ': ' + hasAccount)
                if (!hasAccount) {
                    tkl[idx]['create'] = true
                } else {
                    tkl[idx]['create'] = false
                }
            }
            //console.log(mint.toString() + ' ' + tokens + ' ' + scale + ' ' + decimals)
            var bal = new Number(tokens / scale)
            bal = bal.toLocaleString(undefined, {
                'minimumFractionDigits': decimals,
                'maximumFractionDigits': decimals,
            })
            tkl[idx]['amount'] = bal
            return true
        }

        const settlementEntries = async (firstLog) => {
            var walletPK = props.market.userWallet

            var nextLog = firstLog.toString()
            var logAccounts = []
            var entries = []

            var vault = await $solana.getUserVault(new PublicKey(market.value.marketAddr), walletPK)
            if (vault) {
                logAccounts.push(vault.publicKey)
                entries.push({
                    'vault': vault.publicKey,
                    'mkt_token_balance': new Number(vault.mktTokens),
                    'prc_token_balance': new Number(vault.prcTokens),
                })
            }

            do {
                try {
                    var logPK = new PublicKey(nextLog)
                    var logInfo = await $solana.getAccountInfo(logPK)
                    logAccounts.push(logPK)
                    var logData = $solana.decodeSettlementLog(logInfo.data, walletPK)
                    for (var i = 0; i < logData.entries.length; i++) {
                        var entry = logData.entries[i]
                        entry['log'] = logPK
                        entry['prev'] = new PublicKey(logData.header.prev)
                        entry['next'] = new PublicKey(logData.header.next)
                        entries.push(entry)
                    }
                    nextLog = logData.header.next
                } catch (error) {
                    console.log('Error reading settlement logs: ' + error)
                    nextLog = '11111111111111111111111111111111'
                }
            } while (nextLog !== '11111111111111111111111111111111')
            settleList.value = entries
            return logAccounts
        }

        const updateTokenInfo = async (marketSpec) => {
            var marketData = marketSpec.marketData
            var walletPK = marketSpec.userWallet
            var mktScale = marketSpec.mktTokenScale
            var mktDecimals = marketSpec.mktTokenDecimals
            var prcScale = marketSpec.prcTokenScale
            var prcDecimals = marketSpec.prcTokenDecimals
            tokenList.value[0].name = marketSpec.mktTokenLabel
            tokenList.value[1].name = marketSpec.prcTokenLabel
            tokenList.value[0].symbol = marketSpec.mktTokenSymbol
            tokenList.value[1].symbol = marketSpec.prcTokenSymbol
            var results = await Promise.all([
                updateBalance(marketData.mktMint, walletPK, mktScale, mktDecimals, 0),
                updateBalance(marketData.prcMint, walletPK, prcScale, prcDecimals, 1),
                settlementEntries(marketData.settle0),
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
            var logAccounts = results[2]
            for (var i = 0; i < logAccounts.length; i++) {
                var k = logAccounts[i].toString()
                if (!logUpdates[k]) {
                    logUpdates[k] = true
                    $solana.provider.connection.onAccountChange(logAccounts[i], async (accountInfo, context) => {
                        console.log('Updated Settlement Log')
                        await settlementEntries(marketData.settle0)
                    })
                }
            }
        }

        events.value.once('refresh_token_list', async () => {
            console.log('Refresh Token List')
            await updateTokenInfo(market.value)
            console.log('Refresh Token List Done')
        })

        var tokenUpdates = false
        var logUpdates = {}
        watch([market], async (current, prev) => {
            if (current[0].marketReady) {
                await updateTokenInfo(current[0])
            }
        })

        watch(settleList, (current, prev) => {
            //console.log('Settlement List')
            //console.log(settleList.value)
            var mt = 0
            var pt = 0
            for (var i = 0; i < settleList.value.length; i++) {
                mt = mt + settleList.value[i].mkt_token_balance
                pt = pt + settleList.value[i].prc_token_balance
            }
            if (mt > 0 || pt > 0) {
                if (mt > 0) {
                    mt = mt / market.value.mktTokenScale
                    mt = mt.toLocaleString(undefined, {
                        'minimumFractionDigits': market.value.mktTokenDecimals,
                        'maximumFractionDigits': market.value.mktTokenDecimals,
                    })
                } else {
                    mt = ''
                }
                if (pt > 0) {
                    pt = pt / market.value.prcTokenScale
                    pt = pt.toLocaleString(undefined, {
                        'minimumFractionDigits': market.value.prcTokenDecimals,
                        'maximumFractionDigits': market.value.prcTokenDecimals,
                    })
                } else {
                    pt = ''
                }
                settleFunds.value = {
                    'unsettled': true,
                    'mktTokens': mt,
                    'prcTokens': pt,
                }
            } else {
                settleFunds.value = {
                    'unsettled': false,
                    'mktTokens': '',
                    'prcTokens': '',
                }
            }
        })

        const settleTokens = () => {
            context.emit('settleTokens', {'logEntries': settleList.value})
        }

        const createTokenAccount = (tokenSelect) => {
            if (tokenSelect === 1) {
                context.emit('createTokenAccount', 'pricing')
            } else {
                context.emit('createTokenAccount', 'market')
            }
        }

        return {
            tokenList,
            settleFunds,
            settleTokens,
            createTokenAccount,
            icons: {
                mdiDotsVertical,
                mdiChevronUp,
                mdiChevronDown,
            },
        }
    },
}
</script>
