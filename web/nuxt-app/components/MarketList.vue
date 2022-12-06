<template>
    <v-card>
        <v-card-title class="align-start">
            <span>Market List</span>
            <v-spacer></v-spacer>
        </v-card-title>
        <v-card-text>
            <div v-for="(mkt,index) in markets" :key="mkt.avatar" :class="`d-flex align-start ${index >0 ? 'mt-8':''}`">
                <v-avatar rounded size="38" color="#5e56690a" class="me-4">
                    <v-icon aria-label="Market" role="img" aria-hidden="false">
                      {{ icons.mdiRotate3dVariant }}
                    </v-icon>
                </v-avatar>
                <div class="d-flex align-center flex-grow-1 flex-wrap">
                    <div>
                        <h4 class="font-weight-medium">
                            <router-link :to="'/market/' + mkt.address">{{ mkt.title }}</router-link>
                        </h4>
                        <span class="text-xs text-no-wrap">{{ mkt.subtitle }}</span>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant } from '@mdi/js'

export default {
    setup() {
        const markets = [
            {
                avatar: require('@/assets/images/logos/zipcar.png'),
                title: 'SOL / USDC',
                subtitle: 'Solana SOL / USD Coin',
                color: 'primary',
                address: '6attyhCFqY1ZZqeRp3eQWnCf5QFViAgaHtYtck7y7CD',
            },
        ]
        return {
            markets,
            icons: { mdiDotsVertical, mdiMenuUp, mdiRotate3dVariant },
        }
    },
}
</script>
