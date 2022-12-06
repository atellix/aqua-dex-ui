<template>
  <v-row>
    <v-col cols="12" md="8">
      <dashboard-statistics-card></dashboard-statistics-card>
    </v-col>
    <v-col cols="12" md="4">
      <dashboard-congratulation-john></dashboard-congratulation-john>
    </v-col>

    <v-col cols="12" md="8">
      <dashboard-weekly-overview></dashboard-weekly-overview>
    </v-col>
    <v-col cols="12" md="4">
      <dashboard-card-sales-by-countries></dashboard-card-sales-by-countries>
    </v-col>

    <v-col cols="12" md="8">
      <dashboard-card-deposit-and-withdraw></dashboard-card-deposit-and-withdraw>
    </v-col>
    <v-col cols="12" md="4">
      <dashboard-card-total-earning></dashboard-card-total-earning>
    </v-col>

    <v-col cols="12">
      <dashboard-datatable></dashboard-datatable>
    </v-col>
  </v-row>
</template>

<script>
// eslint-disable-next-line object-curly-newline
import {
  mdiPoll,
  mdiLabelVariantOutline,
  mdiCurrencyUsd,
  mdiHelpCircleOutline,
} from "@mdi/js";
import StatisticsCardVertical from "@/components/statistics-card/StatisticsCardVertical.vue";

// demos
import DashboardCongratulationJohn from "@/components/dashboard/DashboardCongratulationJohn.vue";
import DashboardStatisticsCard from "@/components/dashboard/DashboardStatisticsCard.vue";
import DashboardCardTotalEarning from "@/components/dashboard/DashboardCardTotalEarning.vue";
import DashboardCardDepositAndWithdraw from "@/components/dashboard/DashboardCardDepositAndWithdraw.vue";
import DashboardCardSalesByCountries from "@/components/dashboard/DashboardCardSalesByCountries.vue";
import DashboardWeeklyOverview from "@/components/dashboard/DashboardWeeklyOverview.vue";
import DashboardDatatable from "@/components/dashboard/DashboardDatatable.vue";

export default {
  components: {
    StatisticsCardVertical,
    DashboardCongratulationJohn,
    DashboardStatisticsCard,
    DashboardCardTotalEarning,
    DashboardCardDepositAndWithdraw,
    DashboardCardSalesByCountries,
    DashboardWeeklyOverview,
    DashboardDatatable,
  },
  layout: "Content",
  setup() {
    const totalProfit = {
      statTitle: "Total Profit",
      icon: mdiPoll,
      color: "success",
      subtitle: "Weekly Project",
      statistics: "$25.6k",
      change: "+42%",
    };

    const totalSales = {
      statTitle: "Refunds",
      icon: mdiCurrencyUsd,
      color: "secondary",
      subtitle: "Past Month",
      statistics: "$78",
      change: "-15%",
    };

    // vertical card options
    const newProject = {
      statTitle: "New Project",
      icon: mdiLabelVariantOutline,
      color: "primary",
      subtitle: "Yearly Project",
      statistics: "862",
      change: "-18%",
    };

    const salesQueries = {
      statTitle: "Sales Quries",
      icon: mdiHelpCircleOutline,
      color: "warning",
      subtitle: "Last week",
      statistics: "15",
      change: "-18%",
    };

    return {
      totalProfit,
      totalSales,
      newProject,
      salesQueries,
    };
  },
};
</script>
