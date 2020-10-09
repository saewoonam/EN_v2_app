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
        field: 'encounterId',
        label: 'ID',
        width: '40'
      }
    ]
  }),
  methods: {

  }
}
</script>