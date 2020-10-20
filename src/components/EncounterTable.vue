<template>
<div class="encounter-table">
  <b-table :data="data" :mobile-cards=false>
    <b-table-column field="timestamp" label="timestamp" v-slot="props">
      {{ props.row.timestamp }}
    </b-table-column>

    <b-table-column field="sound" label="sound[m]" centered v-slot="props">
      <span :class="props.row.sound < 2 ? 'tag is-danger':''">
        {{ props.row.sound }}
      </span>
    </b-table-column>

    <b-table-column field="rssi" label="rssi [dBm]" centered v-slot="props">
      {{ props.row.rssi }}
    </b-table-column>
  </b-table>
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
  // data: () => ({
  //   columns: [
  //     {
  //       field: 'timestamp',
  //       label: 'timestamp',
  //     },
  //     {
  //       field: 'sound',
  //       label: 'sound[m]',
  //       // width: '80',
  //       centered: true,
  //     },
  //     {
  //       field: 'rssi',
  //       label: 'rssi [dBm]',
  //       centered: true,
  //     }
  //   ]
  // }),
  methods: {

  }
}
</script>
