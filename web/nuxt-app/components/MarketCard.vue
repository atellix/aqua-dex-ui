<template>
    <v-card>
        <div>
            <v-divider :vertical="$vuetify.breakpoint.mdAndUp"></v-divider>
            <v-row>
                <v-col cols="4" sm="12" md="4" lg="4" align="center">
                    <router-link :to="'/market/' + marketInfo.address"><v-img class="mr-3 ml-3 mt-3 mb-3" max-width="300" :src="marketInfo.image"></v-img></router-link>
                </v-col>
                <v-col cols="8" sm="12" md="8" lg="8">
                    <v-card-title>
                        {{ marketInfo.title }}
                    </v-card-title>
                    <v-card-subtitle class="text-no-wrap">
                        {{ marketInfo.subtitle }}
                    </v-card-subtitle>
                    <v-card-actions class="d-flex justify-space-between dense">
                        <router-link :to="'/market/' + marketInfo.address" custom v-slot="{ navigate }">
                            <v-btn small color="primary" @click="navigate" role="link"> 
                                Access Market &raquo;
                            </v-btn>
                        </router-link>
                        <v-btn icon>
                            <v-icon>{{ icons.mdiShareVariantOutline }}</v-icon>
                        </v-btn>
                    </v-card-actions>
                    <v-card-text v-if="!$store.state.device.isDesktop" style="margin-left: -12px;">
                        <a :href="phantomLink(marketInfo.address)">
                            <v-img height="38" width="169" :src="require('@/assets/images/atellix/phantom-open-1.png')"></v-img>
                        </a>
                    </v-card-text>
                    <v-card-text>
                        {{ marketInfo.description }}
                    </v-card-text>
                    <v-card-text v-if="marketInfo.link" class="text--primary text-base">
                        <a :href="'https://' + marketInfo.link" target="_blank">{{ marketInfo.link }}</a>
                    </v-card-text>
                    <v-card-text v-if="marketInfo.coingecko">
                        <div class="mt-3">
                            <a :href="'https://' + marketInfo.coingecko" target="_blank"><v-img height="37" width="130" :src="require('@/assets/images/atellix/coingecko-logo-1.png')"></v-img></a>
                        </div>
                    </v-card-text>
                </v-col>
            </v-row>
        </div>
    </v-card>
</template>
<script>
import { mdiShareVariantOutline } from '@mdi/js'

export default {
    props: ['marketInfo'],
    setup() {
        return {
            icons: { mdiShareVariantOutline },
        }
    },
    methods: {
        phantomLink (marketAddress) {
            return 'https://phantom.app/ul/browse/' + encodeURIComponent('https://' + document.location.host + '/market/' + marketAddress) + '?ref=' + encodeURIComponent('https://' + document.location.hostname)
        }
    }
}
</script>
