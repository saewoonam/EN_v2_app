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
            <b-button @click="unselect" type="is-danger is-rounded" icon-right="power-plug-off"></b-button>
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

    <b-progress v-if="progress > 0" :value="progress"></b-progress>

    <b-field grouped position="is-centered" class="block">
      <div class="control">
        <b-button size="is-medium" @click="getEncounters" v-if="progress === 0">Upload</b-button>
        <!-- <b&#45;button size="is&#45;medium" @click="syncWithServer" v&#45;if="progress === 0">Upload</b&#45;button> -->
        <b-button size="is-medium" type="is-danger" @click="cancelDataFetch" v-else>
          <b-icon
            icon="sync"
            custom-class="mdi-spin">
          </b-icon>
          Cancel
        </b-button>
      </div>
      <div class="control">
        <b-button size="is-medium" @click="recentData" :disabled="progress > 0">View recent</b-button>
      </div>
      <!-- <div class="control">
        <b-button size="is-medium" :type="flashWrite ? 'is-warning' : 'is-info'" @click="toggleFlash">{{ flashWrite ? 'Stop Recording' : 'Start Recording' }}</b-button>
      </div> -->
    </b-field>

    <EncounterTable v-if="encounterData.length" :data="encounterData"/>
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
import EncounterTable from './EncounterTable'

const SERVER_SYNC_URL = 'http://68.183.130.247:8000/api/encounters/debug'

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
    EncounterTable
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
    progress: 0,
    encounterData: []
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
    console.log("in mounted device control");
    const selected = async () => {
      this.busy = true
      this.deviceName = this.$dongle.getDeviceName()
      console.log("deviceName", this.deviceName);
      // await this.fetchState()
      this.busy = false
    }
    const unselected = () => {}

    this.$dongle.on('selected', selected)
    this.$dongle.on('unselected', unselected)
    this.selected = this.$dongle.isSelected()
    if (this.selected){ selected() }

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('selected', selected)
      this.$dongle.off('unselected', unselected)
    })
  },

  methods: {
    async fetchState(){
      this.busy=true
      let connected = false
      do {
        let device = await this.$dongle.discover(this.deviceName)
        console.log("fetchState device", device)
        await this.$dongle.connect(device.id)
          .then(_=>{connected=true})
          .catch(_=>{connected=false})
      } while (!connected)
      await this.checkBattery()
      await this.getMemoryUsage()
      await this.getUptime()
      await this.$dongle.disconnect()
      this.busy=false
    },

    unselect(){
      this.$emit('unselect')
    },

    feedback(msg, type = 'is-info'){
      this.$buefy.snackbar.open({
        message: msg,
        type,
        position: 'is-bottom'
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
        if ((this.status & (1<<2)) == 4) {
          this.$dongle.syncClock(this.uptime)
        }

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

    async recentData() {
      try {
        this.encounterData = await this.$dongle.fetchRecentData()
        if (!this.encounterData.length){
          this.feedback('No recent encounters')
        }
      } catch (err){
        this.onError(err)
      }
    },

    cancelDataFetch(){
      if (this._dataFetchInterrupt){
        this._dataFetchInterrupt.interrupt = true
      }
      this.progress = 0
    },

    async getEncounters() {
      try {
        this._dataFetchInterrupt = {
          interrupt: false,
          onProgress: (received, expected) => {
            this.progress = received / expected * 100
          }
        }
        let data = await this.$dongle.fetchData(this._dataFetchInterrupt)
        if (data.length){
          await this.sendDataToServer(data)
        }
        this.feedback('Synched with server', 'is-success')
        // Send command to mark flash to device
        if (data.length) this.$dongle.sendCommand('markFlashUpload')

      } catch (err) {
        if (err instanceof InterruptException){
          // no action
        } else {
          this.onError(err)
        }
      } finally {
        this.progress = 0
      }
    },

    async sendDataToServer(data){
      // this.progress = 1
      console.log("sendDataToServer")
      let encounters = data.map(d => {
        return {
          encounterId: d.encounterId,
          timestamp: d.timestamp,
          _meta: d
        }
      })
      const batchLength = 50
      const batches = []
      for (let i = 0, l = encounters.length; i < l; i++){
        let b = Math.floor(i / batchLength)
        let batch = batches[b] = batches[b] || []
        batch.push(encounters[i])
      }
      let count = 0;
      console.log("Length of batches", batches.length);
      for (let batch of batches){
        let sent = false;
        let res;
        do {
          let response = await fetch(SERVER_SYNC_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ encounters: batch })
          }).catch(e => console.log("fetch error", e))
          res = await response.json()
          // console.log("got response", res)
          if (res.errors.length){
            console.log("upload error", res.errors)
            // throw new Error('Server Error: ' + res.errors[0].message)
          } else {
            sent = true;
          }
        } while (!sent)
        count ++;
        console.log("count: ", count, res);
        this.progress = count / batches.length * 100;
      }
      this.progress = 0
      console.log("sendDataToServer end");
    },

    onError(e){
      this.feedback('Error: ' + e.message, 'is-danger')
      this.$emit('error', e)
      this.busy = false
    }
  }
}
</script>
