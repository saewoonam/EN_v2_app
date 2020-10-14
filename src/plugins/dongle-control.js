import Vue from 'vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from './dongle-config'
import sanitize from 'sanitize-filename'
import {raw2row, checkForMarkOrHeader, getDataFromView} from '../tools/data-parse'

const COMMAND_TIMEOUT = 5000
const noop = () => {}

function toBtValue(val){
  if (typeof val === 'number'){
    let buf = new ArrayBuffer(4)
    let view = new DataView(buf)
    view.setUint32(0, val, true)
    return new Uint8Array(buf)
  }

  if (typeof val === 'string'){
    return Uint8Array.of(val.charCodeAt(0))
  }

  throw new Error('Can not encode value for bluetooth write')
}

export class OutOfOrderException extends Error {
  constructor(){
    super('Received block out of order')
  }
}

export class InterruptException extends Error {
  constructor(){
    super('Interrupted')
  }
}

function Controller(){
  // just using vue for events
  const pubsub = new Vue()
  let connection = null
  let notifyCallback = noop
  let doneRecent = false;
  let dataRecent = [];
  let row = {}
  row.timestamp = "today"
  row.sound = "3.0"
  row.rssi = "-10.0"

  function assertConnection(){
    if (!connection){
      throw new Error('No connection established')
    }
  }

  async function disconnect(){
    if (!connection){ return }
    await ble.withPromises.disconnect(connection.id)
    connection = null
    pubsub.$emit('disconnected')
  }

  async function connect(deviceId) {
    if (!deviceId){
      throw new Error('Invalid UUID specified')
    }
    await disconnect()
    return new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        ble.disconnect(deviceId)
        reject(new Error('Connection timeout'))
      }, COMMAND_TIMEOUT)

      ble.connect(
        deviceId,
        (c) => {
          clearTimeout(timeout)
          connection = c
          pubsub.$emit('connected', connection)
          resolve(c)
        },
        () => {
          connection = null
          pubsub.$emit('disconnected')
        }
      )
    })
  }

  async function getMemoryUsage(){
    assertConnection()

    let res = await ble.withPromises.read(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.count
    )

    let data = new Uint16Array(res)
    return data
  }

  async function getBatteryLevel(){
    assertConnection()

    let res = await ble.withPromises.read(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.battery
    )

    let a = new Uint8Array(res)
    return a[0]
  }

  function sendCommand(name){
    const command = COMMANDS[name]

    if (!command){
      return Promise.reject(new Error('No command named: ' + name))
    }

    return new Promise((resolve, reject) => {
      assertConnection()
      console.log("command", name, command.notify);
      let timeout
      if (command.notify) {
        timeout = setTimeout(() => {
          console.log("timeout stop notification");
          stopNotifications()
          notifyCallback = noop
          reject(new Error('Command timed out before receiving response via notify'))
        }, COMMAND_TIMEOUT)
      }

      function done(res) {
        if (command.notify) {
          clearTimeout(timeout)
          console.log("done stop notification");
          // stopNotifications()
          stopNPromise()
            .catch(err => reject(err))
        }
        try {
          let data = res ?
            new command.returnType(res) :
            []
          resolve(data)
        } catch(err){
          reject(err)
        }
      }

      if (command.notify){
        startNotifications(done)
      }

      ble.withPromises.write(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.rw,
        toBtValue(command.value).buffer
      ).then(res => {
        if (!command.notify){
          resolve(res)
        }
      }).catch(err => {
        if (command.notify) {
          console.log("error stop notification");
          stopNotifications()
        }
        notifyCallback = noop
        console.log("Error trying to send: ", command.value, err)
        reject(err)
      })

    })
  }

  async function setName(name){
    assertConnection()
    if (name.length > 8){
      throw new Error('Name must be less than 8 characters')
    }

    let value = new Uint8Array(8)
    for (let i = 0; i < name.length; i++){
      value[i] = name.charCodeAt(i)
    }

    await ble.withPromises.writeWithoutResponse(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      value.buffer
    )

    await sendCommand('setName')
  }

  async function syncClock(uptime){
    assertConnection()
    let value = new Uint32Array(3)
    value[0] = parseInt((new Date()).getTime() / 1000)
    value[1] = uptime[0]
    value[2] = uptime[1]
    setTimeout(async function() {
      await ble.withPromises.writeWithoutResponse(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.data,
        value.buffer
      )
      await sendCommand('setClock')
    }, 75);
  }

  async function recentData(tableData) {
    assertConnection()

    // tableData = []
    doneRecent = false;
    // tableData.push(row)
    let local = []
    console.log('recentData')

    let handleCmde = function(res){
      let blockNumber = new Uint32Array(res, 0, 1)[0]
      if (blockNumber == 0xFFFFFFFF) {
        ble.stopNotification(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data
        )
        notifyCallback = noop;
        console.log("finished fetch recent");
        // row.timestamp = "today"
        // row.sound = local.length
        // console.log(local)
        console.log(local.length)
        // row.rssi = -1
        // tableData.push(row)
        doneRecent = true;
      } else {
        local.push(res);
        tableData.push(raw2row(res));
      }
    }
    ble.startNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      handleCmde
    )
    try {
      await sendCommand('recentData')
    } catch (err){
      console.log("error in trying to send recentData")
      throw err
    }

  }

  function stopNotifications() {
    ble.stopNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
    )
  }

  function startNotifications(callback) {
      ble.startNotification(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.data,
        callback
      )
  }

  async function startNPromise(callback=noop, interval=75) {
    // ble.startNotification(
    //   connection.id,
    //   SERVICE_UUID,
    //   CHARACTERISTICS.data,
    //   callback
    // )
    startNotifications(callback)
    return new Promise(async function(resolve, reject) {
      setTimeout(function(){
        resolve("done");
      }, interval);
    });
  }

  async function stopNPromise(interval=75) {
    // ble.stopNotification(
    //   connection.id,
    //   SERVICE_UUID,
    //   CHARACTERISTICS.data
    // )
    stopNotifications();
    return new Promise(async function(resolve, reject) {
      setTimeout(function(){
        resolve("done");
      }, interval);
    });
  }

  async function fetch(expectedLength, opts = { interrupt: false, onProgress: () => {} }) {
    return new Promise(async function (resolve, reject) {
      let result = new Uint8Array(expectedLength)
      let bytesReceived = 0;
      let blocksReceived = 0;
      let callback = async function (res) {
      // let callback = function (res) {
        var value = new DataView(res)
        let blockNumber = value.getUint32(0, true);
        let block = new Uint8Array(value.buffer, 4);
        if (blockNumber !== blocksReceived) {
          stopNotifications()
          setTimeout(async function() {
            await sendCommand('stopDataDownload')
            reject(new OutOfOrderException())
          }, 75);
        }
        if (opts.interrupt){
          stopNPromise()
            .then(async function() {
              await sendCommand('stopDataDownload')
              console.log("fetch interrupted")
              reject(new InterruptException())
            })
        }
        result.set(block, bytesReceived);
        bytesReceived += block.byteLength;
        blocksReceived++;
        console.log(blocksReceived, bytesReceived, expectedLength);
        if (opts.onProgress){
          opts.onProgress(bytesReceived, expectedLength)
        }
        if (bytesReceived == expectedLength) {
          stopNPromise()
            .then(async function() {
              await sendCommand('stopDataDownload')
              resolve(result);
            })
        } else {
          ble.withPromises.writeWithoutResponse(
            connection.id,
            SERVICE_UUID,
            CHARACTERISTICS.data,
            toBtValue(blocksReceived).buffer
          ).catch(err => {
            console.log("catch error in write", err, opts.interrupt);
            if (opts.interrupt) { // this is a hack to change err to interrupt
              reject(new InterruptException())
            } else {
              reject(err)
            }
          })
        }
      }
      /*  need to pause here, otheriwse startNotifications doesn't work */
      setTimeout(async function() {
        startNPromise(callback)
          .then(sendCommand('startDataDownload'))
          .then(ble.withPromises.writeWithoutResponse(
            connection.id,
            SERVICE_UUID,
            CHARACTERISTICS.data,
            toBtValue(blocksReceived).buffer
          )).catch(err => {
            reject(err)
          })
      }, 75);
    })
  }

  async function uploadData(opts = { interrupt: false, onProgress: () => {} }) {
    assertConnection()
    await sendCommand('startLastUpload')
    let start_mem = 0;
    let stop_mem = (await getMemoryUsage())[0]
    /* get start_mem has to come after getMemoryUssage, otherwise error */
    let value = await sendCommand('getLastUpload')
    start_mem = value[0];
    let binary_data;
    try {
      binary_data = await fetch( (stop_mem-start_mem)<<5, opts)
    } catch (err) {
      console.log("uploadData catch error", err);
      throw err
    } finally {
      // setTimeout(async function() {
      //   await sendCommand('stopDataDownload')
      // }, 75);
    }
    /* prep data for server, filter out marks and headers */
    let data_to_server = []
    for (let offset = 0; offset < binary_data.byteLength; offset += 32) {
      let chunk = binary_data.slice(offset, offset + 32);
      let check = checkForMarkOrHeader(chunk.buffer, 0)
      if (check) {
        console.log(offset >> 5, chunk.buffer)
      } else {
        chunk = binary_data.slice(offset, offset + 64);
        // console.log("chunk to convert", chunk);
        let dv = new DataView(chunk.buffer);
        let row = getDataFromView(dv)
        data_to_server.push(row)
        // let row = raw2row(chunk.buffer, 0)
        // console.log(row);
        offset += 32;
      }
    }
    console.log("number of entries", data_to_server.length)
    return data_to_server
  }

  return {
    connect,
    disconnect,
    getMemoryUsage,
    getBatteryLevel,
    setName,
    syncClock,
    recentData,
    uploadData,
    getDeviceName: () => sanitize(connection.name || ''),
    isConnected: () => !!connection,
    on: pubsub.$on.bind(pubsub),
    off: pubsub.$off.bind(pubsub),
    once: pubsub.$once.bind(pubsub)
  }
}

export default {
  install(Vue) {
    Vue.prototype.$dongle = Controller()
  }
}
