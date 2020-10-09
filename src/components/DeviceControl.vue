<template>
<div class="device-control">
  <b-loading :is-full-page="false" :active="busy"></b-loading>

  <nav class="level is-mobile">
    <div class="level-left">
      <div class="level-item">
        <div class="heading is-size-6">
          {{ deviceName || '(Anonymous)' }}
        </div>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item has-text-right">
        <b-field grouped position="is-right">

          <div class="control battery">
            <b-icon :icon="batteryIcon" :type="batteryColor" />
          </div>
          <div class="control">
            <b-button @click="fetchState" type="is-rounded is-inverted" icon-right="reload"></b-button>
          </div>
          <div class="control">
            <b-button @click="disconnect" type="is-danger is-rounded" icon-right="power-plug-off"></b-button>
          </div>

        </b-field>
      </div>
    </div>
  </nav>

  <div class="inner">
    <b-field grouped group-multiline class="block">
      <div class="control">
        <b-taglist attached>
          <b-tag type="is-dark">
            <b-icon icon="timer" size="is-small" />
          </b-tag> <b-tag type="is-info">{{ uptimeText }}</b-tag>
        </b-taglist>
      </div>
      <div class="control">
        <b-taglist attached>
          <b-tag type="is-dark">
            mem
          </b-tag>
          <b-tag type="is-info">{{ blockCount }}</b-tag>
        </b-taglist>
      </div>
    </b-field>

    <b-field grouped position="is-centered" class="block">
      <div class="control">
        <b-button size="is-medium" @click="fetchData">Upload</b-button>
        <!-- <b-button size="is-medium" :type="flashWrite ? 'is-warning' : 'is-info'" @click="toggleFlash">{{ flashWrite ? 'Stop Recording' : 'Start Recording' }}</b-button> -->
      </div>
      <div class="control">
        <b-button size="is-medium" @click="recentData">View recent</b-button>
      </div>
    </b-field>
  </div>
</div>
</template>

<style lang="scss" scoped>
.device-control {
  .inner {
    padding: 0.75rem;
  }

  .level {
    margin: 0;
  }
  .battery {
    padding-top: 7px;
  }
  .info {
    margin-bottom: 2rem;
  }

  .block {
    margin-bottom: 4rem;
  }

  nav.level {
    box-shadow: 0 2px 0 0 whitesmoke;
    padding: 0.75rem;
    margin-bottom: 1rem;

    .heading {
      margin: 0;
    }
  }
}
</style>

<script>
import { bytesToData, bytesToCsv, parse_binary } from '../tools/data-parse'
import { InterruptException } from '../plugins/dongle-control'

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
  name: 'DeviceControl',
  props: {
  },
  components: {
  },
  data: () => ({
    busy: false,
    deviceName: '',
    uptime: [],
    batteryLevel: 0,
    blockCount: 0,
    status: 0,
    flashWrite: 0,
    recordedPrimary: false,
    progress: 0
  }),
  watch: {
  },
  computed: {
    batteryIcon(){
      let v = Math.floor(this.batteryLevel / 10) * 10
      if (v === 100){ return 'battery' }
      return `battery-${v}`
    },
    batteryColor(){
      if (this.batteryLevel < 30){ return 'is-danger' }
      if (this.batteryLevel < 60){ return 'is-warning' }
      return 'is-success'
    },
    uptimeText(){
      let ms = this.uptime[0]
      return msToTime(ms)
    }
  },

  mounted(){

    const connected = async () => {
      this.busy = true
      this.deviceName = this.$dongle.getDeviceName()
      await this.fetchState()
      if ((this.status & (1<<2)) == 4) {
        await this.$dongle.syncClock()
      }
      this.busy = false
    }
    const disconnected = () => {}

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
    async fetchState(){
      await this.checkBattery()
      await this.checkFlashUsage()
      await this.getMemoryUsage()
      await this.getUptime()
    },

    disconnect(){
      this.$emit('disconnect')
    },

    feedback(msg, type = 'is-info'){
      this.$buefy.snackbar.open({
        message: msg,
        type,
        position: 'is-top'
      })
    },

    async checkBattery(){
      this.batteryLevel = await this.$dongle.getBatteryLevel()
    },

    getMemoryUsage(){
      return this.$dongle.getMemoryUsage().then(usage => {
        this.blockCount = usage[0]
        this.status = usage[1] >> 8
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

    recentData() {
      // put recent data in a table here.
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
      this.feedback('Error: ' + e.message, 'is-error')
      this.$emit('error', e)
    }
  }
}
</script>
