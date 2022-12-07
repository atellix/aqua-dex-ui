<template>
    <v-row>
        <v-col cols="12" md="12">
            <market-list></market-list>
        </v-col>
    </v-row>
</template>

<script>
import MarketList from "@/components/MarketList.vue";

export default {
    components: {
        MarketList,
    },
    layout: "Content",
    head() {
        return {
            title: 'AquaDEX Markets'
        }
    },
    setup() {
        return {}
    },
};
</script>
