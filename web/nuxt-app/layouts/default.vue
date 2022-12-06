<template>
    <v-app>
        <vertical-nav-menu :is-drawer-open.sync="isDrawerOpen"></vertical-nav-menu>

        <v-app-bar app flat absolute color="transparent">
            <div class="boxed-container w-full">
                <div class="d-flex align-center mx-6">
                    <!-- Left Content -->
                    <v-app-bar-nav-icon
                        class="d-block d-lg-none me-2"
                        @click="isDrawerOpen = !isDrawerOpen"
                    ></v-app-bar-nav-icon>

                    <v-spacer></v-spacer>

                    <!-- Right Content -->
                    <theme-switcher></theme-switcher>
                </div>
            </div>
        </v-app-bar>

        <v-main>
            <div class="app-content-container boxed-container pa-6">
                <Nuxt />
            </div>
        </v-main>

        <v-footer app inset color="transparent" absolute height="56" class="px-0">
            <div class="boxed-container w-full">
                <div class="mx-6 d-flex justify-space-between">
                    <span>
                        &copy; 2022
                        <a href="https://atellix.com" class="text-decoration-none" target="_blank">Atellix, Inc.</a>
                    </span>
                    <span class="d-sm-inline d-none">
                        <a href="https://themeselection.com/blog/" target="_blank" class="me-6 text--secondary text-decoration-none">Terms</a>
                        <a href="https://github.com/LICENSE" target="_blank" class="text--secondary text-decoration-none">MIT Licence</a>
                    </span>
                </div>
            </div>
        </v-footer>
    </v-app>
</template>

<script>
import { ref } from "@vue/composition-api";
import { mdiMagnify, mdiBellOutline, mdiGithub } from "@mdi/js";
import VerticalNavMenu from "@/layouts/components/vertical-nav-menu/VerticalNavMenu.vue";
import ThemeSwitcher from "@/layouts/components/ThemeSwitcher.vue";
import AppBarUserMenu from "@/layouts/components/AppBarUserMenu.vue";

export default {
    components: {
        VerticalNavMenu,
        ThemeSwitcher,
        AppBarUserMenu,
    },
    setup() {
        const isDrawerOpen = ref(null);

        return {
            isDrawerOpen,

            // Icons
            icons: {
                mdiMagnify,
                mdiBellOutline,
                mdiGithub,
            },
        };
    },
};
</script>

<style lang="scss" scoped>
.v-app-bar ::v-deep {
    .v-toolbar__content {
        padding: 0;

        .app-bar-search {
            .v-input__slot {
                padding-left: 18px;
            }
        }
    }
}

.boxed-container {
    max-width: 1440px;
    margin-left: auto;
    margin-right: auto;
}
</style>
