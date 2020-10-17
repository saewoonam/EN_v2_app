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
    <DeviceList v-if="!selected" @select="select" @error="onError"/>
    <DeviceControl v-if="selected" @unselect="unselect"/>
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
    selected: false,
    busy: false,
  }),
  watch: {
  },
  computed: {
  },

  mounted(){
    console.log("mounted in App.vue");

    const selected = async () => {
      this.selected = true
      this.busy = false
    }
    const unselected = () => {
      this.selected = false
      this.busy = false
    }
    this.$dongle.on('selected', selected)
    this.$dongle.on('unselected', unselected)
    this.selected = this.$dongle.isSelected()
    if (this.selected){ selected() }

    // monitor bluetooth enabled state
    const intr = setInterval(() => {
      ble.isEnabled(() => {
        this.bluetoothEnabled = true
      }, () => {
        this.bluetoothEnabled = false
        this.selected = false
      })
    }, 500)

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('selected', selected)
      this.$dongle.off('unselected', unselected)
      clearInterval(intr)
    })
  },

  methods: {

    async select(id){
      console.log("select in App.vue");
      this.busy = true
      // await this.$dongle.select(id).catch(e => this.onError(e))
      this.$dongle.select(id)
    },

    async unselect(){
      await this.$dongle.unselect().catch(e => this.onError(e))
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
