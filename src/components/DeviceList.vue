<template>
<div class="device-list">
  <nav class="level is-mobile">
    <div class="level-left">
      <div class="level-item">
        <div class="heading is-size-6">
          NIST Bluetooth Ultrasound
        </div>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item has-text-right">
        <b-field grouped position="is-right">
          <div class="control">
            <b-button @click="refreshDeviceList" type="is-rounded is-inverted" icon-right="reload"></b-button>
          </div>
        </b-field>
      </div>
    </div>
  </nav>

  <div class="container">
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
</div>
</template>

<style lang="scss" scoped>
nav.level {
  box-shadow: 0 2px 0 0 whitesmoke;
  padding: 0.75rem;
  margin: 0;

  .heading {
    margin: 0;
  }
}
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