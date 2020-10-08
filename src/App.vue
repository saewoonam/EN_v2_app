<template>
<div class="app">
  <b-loading :is-full-page="false" :active="busy"></b-loading>
  <DeviceList v-if="!connected" @connect="connect" @error="onError"/>
  <DeviceControl v-if="connected" @disconnect="disconnect"/>
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

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('connected', connected)
      this.$dongle.off('disconnected', disconnected)
    })
  },

  methods: {

    async connect(id){
      this.loading = true
      this.busy = true
      await this.$dongle.connect(id)
    },

    async disconnect(){
      await this.$dongle.disconnect()
    },

    onError(e){
      this.$buefy.snackbar.open({
        message: 'Error: ' + e.message,
        type: 'is-error',
        position: 'is-top'
      })
      console.error(e)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
