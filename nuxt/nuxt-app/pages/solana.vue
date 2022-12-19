<template>
    <v-row>
        <v-col cols="12" md="12">
            Solana Links
        </v-col>
    </v-row>
</template>

<script>

export default {
    components: {
        MarketList,
    },
    layout: "Content",
    head() {
        return {
            title: 'Solana Link'
        }
    },
    setup() {
        return {}
    },
};
</script>
