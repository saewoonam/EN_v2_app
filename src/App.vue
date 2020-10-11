<template>
<div class="app">
  <b-loading :is-full-page="false" :active="busy"></b-loading>
  <section class="section" v-if="bluetoothEnabled === false">
    <div class="container">
      <article class="message is-warning">
        <div class="message-header">
          <p>Bluetooth Not Enabled</p>
        </div>
        <div class="message-body">
          Please enable bluetooth
        </div>
      </article>
    </div>
  </section>

  <template v-if="bluetoothEnabled">
    <DeviceList v-if="!connected" @connect="connect" @error="onError"/>
    <DeviceControl v-if="connected" @disconnect="disconnect"/>
  </template>
</div>
</template>

<script>
import DeviceControl from './components/DeviceControl'
import DeviceList from './components/DeviceList'

export default {
  name: 'App',
  props: {
  },
  components: {
    DeviceControl,
    DeviceList
  },
  data: () => ({
    bluetoothEnabled: null,
    connected: false,
    busy: false,
  }),
  watch: {
  },
  computed: {
  },

  mounted(){

    const connected = async () => {
      this.connected = true
      this.busy = false
    }
    const disconnected = () => {
      this.connected = false
      this.busy = false
    }
    this.$dongle.on('connected', connected)
    this.$dongle.on('disconnected', disconnected)
    this.connected = this.$dongle.isConnected()
    if (this.connected){ connected() }

    // monitor bluetooth enabled state
    const intr = setInterval(() => {
      ble.isEnabled(() => {
        this.bluetoothEnabled = true
      }, () => {
        this.bluetoothEnabled = false
        this.connected = false
      })
    }, 500)

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('connected', connected)
      this.$dongle.off('disconnected', disconnected)
      clearInterval(intr)
    })
  },

  methods: {

    async connect(id){
      this.busy = true
      await this.$dongle.connect(id).catch(e => this.onError(e))
    },

    async disconnect(){
      await this.$dongle.disconnect().catch(e => this.onError(e))
    },

    onError(e){
      this.$buefy.snackbar.open({
        message: 'Error: ' + e.message,
        type: 'is-danger',
        position: 'is-bottom'
      })
      console.error(e)
      this.busy = false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
