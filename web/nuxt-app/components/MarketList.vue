<template>
    <div>
        <market-card v-for="mkt in markets" :key="mkt.address" :marketInfo="mkt"></market-card>
    </div>
</template>

<script>
import MarketCard from "@/components/MarketCard.vue"
import { ref, onMounted } from '@vue/composition-api'
import { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant } from '@mdi/js'
import axios from 'axios'

const baseURL = 'https://aqua-dev1.atellix.net:8000/v1/'

export default {
    components: {
        MarketCard,
    },
    setup() {
        const markets = ref([])
        const loadMarkets = async () => {
            var url = baseURL + 'market_list'
            var res = await axios.post(url, JSON.stringify({}), { 'Content-Type': 'application/json' })
            if (res.status === 200) {
                return res.data
            }
            return []
        }
        onMounted(async () => {
            markets.value = await loadMarkets()
        })
 
        return {
            markets,
            icons: { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant },
        }
    },
}
</script>
