<template>
<div class="encounter-table">
  <b-table :data="data" :columns="columns"></b-table>
</div>
</template>

<style lang="scss" scoped>
</style>

<script>
export default {
  name: 'EncounterTable',
  props: {
    data: Array
  },
  data: () => ({
    columns: [
      {
        field: 'timestamp',
        label: 'timestamp',
      },
      {
        field: 'sound',
        label: 'sound[m]',
      },
      {
        field: 'rssi',
        label: 'rssi [dBm]',
      }
    ]
  }),
  methods: {

  }
}
</script>
