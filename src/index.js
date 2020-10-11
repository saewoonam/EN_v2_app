// (c) 2020 Sae Woo Nam
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Based on code written by Don Coleman from his cordova ble central package
//
//

import Vue from 'vue'
Vue.config.devtools = true
import App from './App.vue'
import dongleControl from './plugins/dongle-control'
// import router from '@/router'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import '@mdi/font/css/materialdesignicons.css'
import './styles/main.scss'

Vue.use(Buefy)

Vue.use(dongleControl)

Vue.config.productionTip = false

const vueApp = new Vue({
  // router,
  render: h => h(App),
})
Vue.config.devtools = true


document.addEventListener('deviceready', () => {
  // mount the vue app when device ready
  vueApp.$mount('#app')
}, false)
