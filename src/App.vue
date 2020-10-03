<template>
  <div>
    <h2> NIST bluetooth ultrasound </h2>
    <div v-if="!connected">
        <ul>
          <li v-for="d in devices" :key="d.id" @click="connect(d.id)">
            <b>{{ d.name }}</b><br/>
            RSSI: {{ d.rssi }}&nbsp;|&nbsp;{{ d.id }}
          </li>
        </ul>
        <button @click="refreshDeviceList">Refresh</button>
    </div>
    <div v-if="connected">
      <p>Connected to {{ deviceName }}</p>
      <p>Uptime: {{ uptimeText }}</p>
      <p>Battery level: {{ batteryLevel }}</p>
      <p>Memory Blocks Used: {{ blockCount }}</p>
      <button @click="fetchState">Refresh</button>
      <button @click="toggleFlash">{{ flashWrite ? 'Stop Recording' : 'Start Recording' }}</button>
      <button @click="fetchData">Fetch Data</button>
      <button @click="disconnect">Disconnect</button>
    </div>
    <!-- <div id="detailPage">

    </div>
    <div id="resultDiv"></div> -->
  </div>
</template>

<script>
import { battery, nisten_ble } from './config/device.conf'
import { bytesToData, bytesToCsv, parse_binary } from './tools/data-parse'
import { InterruptException } from './plugins/dongle-control'

function msToTime(s) {
  let ms = s % 1000
  s = (s - ms) / 1000
  let secs = s % 60
  s = (s - secs) / 60
  let mins = s % 60
  let hrs = (s - mins) / 60

  return hrs + 'h ' + mins + 'm ' + secs + '.' + ms + 's'
}

export default {
  name: 'App',
  props: {
  },
  components: {
  },
  data: () => ({
    devices: [],
    connected: false,
    deviceName: '',
    uptime: [],
    batteryLevel: 0,
    blockCount: 0,
    flashWrite: 0,
    recordedPrimary: false,
    progress: 0
  }),
  watch: {
  },
  computed: {
    uptimeText(){
      let ms = this.uptime[0]
      return msToTime(ms)
    }
  },

  mounted(){
    this.refreshDeviceList()

    const connected = async () => {
      this.connected = true
      this.deviceName = this.$dongle.getDeviceName()
      await this.fetchState()
      await this.$dongle.syncClock()
    }
    const disconnected = () => {
      this.connected = false
    }

    this.$dongle.on('connected', connected)
    this.$dongle.on('disconnected', disconnected)
    this.connected = this.$dongle.isConnected()
    if (this.connected){ connected() }

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('connected', connected)
      this.$dongle.off('disconnected', disconnected)
    })
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

    async connect(id){
      await this.$dongle.connect(id)
    },

    async disconnect(){
      await this.$dongle.disconnect()
    },

    async checkBattery(){
      this.batteryLevel = await this.$dongle.getBatteryLevel()
    },

    getMemoryUsage(){
      return this.$dongle.getMemoryUsage().then(usage => {
        this.blockCount = usage
      })
      .catch(err => this.onError(err))
    },

    checkFlashUsage(){
      return this.$dongle.sendCommand('isWritingToFlash').then((used) => {
        this.flashWrite = used[0] & 0x01
        this.recordedPrimary = (used[0] & 0x02) === 2
      })
      .catch(err => this.onError(err))
    },

    getUptime(){
      return this.$dongle.sendCommand('getUptime').then((used) => {
        this.uptime = [used[0], used[1]]
      })
      .catch(err => this.onError(err))
    },

    async fetchState(){
      await this.checkBattery()
      await this.checkFlashUsage()
      await this.getMemoryUsage()
      await this.getUptime()
    },

    toggleFlash(){
      let command = this.flashWrite === 1 ? 'stopWritingToFlash' : 'startWritingToFlash'
      return this.$dongle.sendCommand(command).then(() => {
        return this.checkFlashUsage()
      })
      .catch(err => this.onError(err))
    },

    recordPrimary(){
      this.busy = true
      return this.$dongle.sendCommand('recordPrimaryEncounterEvent').then(() => {
        this.recordedPrimary = true
        this.feedback('Set encounter flag in device')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    recordSecondary(){
      this.busy = true
      return this.$dongle.sendCommand('recordSecondaryEncounterEvent').then(() => {
        this.recordedPrimary = false
        this.feedback('Unset encounter flag in device')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    eraseFlash(){
      this.busy = true
      return this.$dongle.sendCommand('eraseFlash').then(() => {
        this.feedback('Erasing flash')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    cancelDataFetch(){
      if (this._dataFetchInterrupt){
        this._dataFetchInterrupt.interrupt = true
      }
      this.progress = 0
    },

    async fetchData(){
      this.cancelDataFetch()
      this._dataFetchInterrupt = {
        interrupt: false,
        onProgress: (received, expected) => {
          this.progress = received / expected * 100
        }
      }

      try {
        let data = await this.$dongle.fetchData(this._dataFetchInterrupt)
        console.log(bytesToData(data))
        return bytesToData(data)
      } catch (e){
        if (e instanceof InterruptException){
          // no action
        } else {
          this.onError(e)
        }
      } finally {
        this.progress = 0
      }
    },

    onError(e){
      alert(e)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
