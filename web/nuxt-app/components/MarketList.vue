<template>
    <div>
        <market-card v-for="mkt in markets" :key="mkt.address" :marketInfo="mkt"></market-card>
    </div>
</template>

<script>
import MarketCard from "@/components/MarketCard.vue"
import { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant } from '@mdi/js'

export default {
    components: {
        MarketCard,
    },
    setup() {
        const markets = [
            {
                image: require('@/assets/images/atellix/ATLX-token-1.png'),
                title: 'ATLX / USDC',
                subtitle: 'Atellix / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                link: 'Atellix.Network',
                description: 'Atellix.Network: Building next-generation markets on blockchain. Creators of Virtual USD, the AquaDEX protocol, and AtellixPay. The ATLX token is the governance token for the Atellix DAO. See terms and conditions for details.',
            },
            {
                image: require('@/assets/images/atellix/SOL-token-1.png'),
                title: 'SOL / USDC',
                subtitle: 'Solana SOL / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                coingecko: 'www.coingecko.com/en/coins/solana',
                description: 'Solana SOL spot market',
            },
            {
                image: require('@/assets/images/atellix/DUST-token-1.png'),
                title: 'DUST / USDC',
                subtitle: 'DUST Protocol / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                link: 'docs.dustprotocol.com',
                coingecko: 'www.coingecko.com/en/coins/dust-protocol',
                description: 'DUST protocol is a decentralized protocol and SPL token created on the Solana blockchain with a starting supply of zero, and a maximum supply of 33,300,000.',
            },
            {
                image: require('@/assets/images/atellix/PUFF-token-1.png'),
                title: 'PUFF / USDC',
                subtitle: 'PUFF Token / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                link: 'www.stonedapecrew.com',
                coingecko: 'www.coingecko.com/en/coins/puff',
                description: 'Building a weed lifestyle brand and a next level web3 tech platform, an ecosystem was built around a “green” deflationary token $PUFF, utilized for herb, apparel, rescuing Nuked Apes, Evolutionary Retreats, and other perks.',
            },
            {
                image: require('@/assets/images/atellix/GMT-token-1.png'),
                title: 'GMT / USDC',
                subtitle: 'STEPN Token / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                link: 'stepn.com',
                coingecko: 'www.coingecko.com/en/coins/stepn',
                description: 'STEPN is a Web3 lifestyle app with Social and Game elements. GMT is STEPN’s governance token and pseudo utility token.',
            },
            {
                image: require('@/assets/images/atellix/ORCA-token-1.png'),
                title: 'ORCA / USDC',
                subtitle: 'Orca / USD Coin',
                address: 'CHnFnUi4eCsY6ZVVF3p8tkkr19U1JZE5rQPtWV5NMB6z',
                link: 'orca.so',
                coingecko: 'www.coingecko.com/en/coins/orca',
                description: 'Trade, farm, and build on Solana’s most user-friendly concentrated liquidity AMM. The ORCA governance token has an initial circulating supply of 5.25 million.',
            },
        ]
        return {
            markets,
            icons: { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant },
        }
    },
}
</script>
