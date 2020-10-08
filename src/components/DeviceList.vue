<template>
<div class="device-list">
  <div class="device-item field is-grouped is-grouped-centered is-marginless">
    <p class="control">
      <button class="button" @click="refreshDeviceList">Refresh</button>
    </p>
  </div>

  <div class="device-item clickable" v-for="d in devices" :key="d.id" @click="$emit('connect', d.id)">
    <div class="name heading is-size-6">
      {{ d.name || '(Anonymous)' }}
    </div>
    <div class="details field is-grouped is-grouped-multiline">
      <div class="control">
        <span class="tag is-dark">{{ d.id }}</span>
      </div>

      <div class="control">
        <div class="tags has-addons">
          <span class="tag is-dark">RSSI</span>
          <span class="tag is-success">{{ d.rssi }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.device-item {
  padding: 1rem;
  border-bottom: 1px solid #d6d6d6;
}
.device-item:first-child {
  border-top: 1px solid #d6d6d6;
}
.device-item.clickable:active {
  background: #c7d6e6;
}
</style>

<script>
export default {
  name: 'DeviceList',
  props: {
  },
  data: () => ({
    devices: []
  }),
  mounted(){
    this.refreshDeviceList()
  },
  methods: {
    refreshDeviceList() {
      this.devices = []
      // scan for all devices
      // ble.scan(['7b183224-9168-443e-a927-7aeea07e8105'], 5, app.onDiscoverDevice, app.onError);
      // ble.scan([nisten_ble.shortUUID], 5, app.onDiscoverDevice, app.onError);
      // ble.scan(['fd6f'], 5, app.onDiscoverDevice, app.onError);
      // ble.scan(['fd6f'], 5, app.onDiscoverDevice, app.onError);
      const discover = device => {
        if (device.rssi <= -80){ return }
        this.devices.push(device)
      }
      ble.scan([], 5, discover, this.onError.bind(this));
    },
    onError(e){
      this.$emit('error', e)
    }
  }
}
</script>