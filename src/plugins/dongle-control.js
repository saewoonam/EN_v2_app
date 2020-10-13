import Vue from 'vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from './dongle-config'
import sanitize from 'sanitize-filename'
import {raw2row} from '../tools/data-parse'

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
  //
  // async function subscribe(callback){
  //   assertConnection()
  //   ble.startNotification(
  //     connection.id,
  //     SERVICE_UUID,
  //     CHARACTERISTICS.data,
  //     callback
  //   )
  // }
  //
  // async function unsubscribe(){
  //   assertConnection()
  //   await ble.withPromises.stopNotification(
  //     connection.id,
  //     SERVICE_UUID,
  //     CHARACTERISTICS.data
  //   )
  // }

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
          stopNotifications()
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

  function delay (cmd, delay_ms) {
    return new Promise((resolve, reject) => {

      let wait = setTimeout(() => {
        clearTimeout(wait);
        cmd();
        resolve("done waiting");
      }, delay_ms)
    });
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

  // async function syncClock_orig(){
  //   assertConnection()
  //   console.log("try to getUptime for syncClock")
  //   let uptime
  //   setTimeout(async function() {
  //     uptime = await sendCommand('getUptime')
  //     console.log("after try uptime", uptime[0], uptime[1]);
  //     let value = new Uint32Array(3)
  //     value[0] = parseInt((new Date()).getTime() / 1000)
  //     value[1] = uptime[0]
  //     value[2] = uptime[1]
  //     setTimeout(async function() {
  //       await ble.withPromises.writeWithoutResponse(
  //         connection.id,
  //         SERVICE_UUID,
  //         CHARACTERISTICS.data,
  //         value.buffer
  //       )
  //       await sendCommand('setClock')
  //     }, 75);
  //   }, 50);
  // }

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
    // notifyCallback = handleCmde

    // await unsubscribe();
    // ble.stopNotification(
    //   connection.id,
    //   SERVICE_UUID,
    //   CHARACTERISTICS.data
    // )
    ble.startNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      handleCmde
    )
    if (true) {
      try {
        await sendCommand('recentData')
      } catch (err){
        console.log("error in trying to send recentData")
        throw err
      }
    } else {

      let cmd = "e"
      ble.write(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.rw,
        toBtValue(cmd).buffer
      )
    }

  }

  function getDataRecent() {
    return dataRecent;
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

  async function fetch(expectedLength, opts = { interrupt: false, onProgress: () => {} }) {
    return new Promise(async function (resolve, reject) {
      let result = new Uint8Array(expectedLength)
      let bytesReceived = 0;
      let blocksReceived = 0;
      // let callback = async function (event) {
      let callback = function (res) {
        // console.log("fetch callback", res);
        var value = new DataView(res)
        let blockNumber = value.getUint32(0, true);
        let block = new Uint8Array(value.buffer, 4);
        // console.log(blockNumber, block);
        if (blockNumber !== blocksReceived) {
          stopNotifications()
          // device.stopDataNotifications(callback);
          // sendCommand('stopDataDownload')
          //   .catch(err => {
          //     reject(err)
          //   })
          reject(new OutOfOrderException())
        }
        result.set(block, bytesReceived);
        bytesReceived += block.byteLength;
        blocksReceived++;
        console.log(blocksReceived, bytesReceived, expectedLength);
        if (bytesReceived == expectedLength) {
          stopNotifications()
          resolve(result);
        } else {
          ble.withPromises.writeWithoutResponse(
            connection.id,
            SERVICE_UUID,
            CHARACTERISTICS.data,
            toBtValue(blocksReceived).buffer
          ).catch(err => {
            reject(err)
          })
        }
      }
      setTimeout(async function() {
        console.log("try to set up notification")
        startNotifications(callback)
      }, 75);
      // setTimeout(async function() {
      //   await sendCommand('startDataDownload')
      // }, 75);
      // setTimeout(async function() {
      //   ble.withPromises.writeWithoutResponse(
      //     connection.id,
      //     SERVICE_UUID,
      //     CHARACTERISTICS.data,
      //     toBtValue(blocksReceived).buffer
      //   ).catch(err => {
      //     reject(err)
      //   })
      // }, 75);
      setTimeout(async function() {
        sendCommand('startDataDownload')
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

  async function uploadData() {
    assertConnection()
      let start_mem = 0;
      let stop_mem = (await getMemoryUsage())[0]
      console.log("stop mem", stop_mem)
      if (true) {
       let value = await sendCommand('getLastUpload')
       start_mem = value[0];
      }
      console.log("start", start_mem);
    try {
      let binary_data = await fetch( (stop_mem-start_mem)<<5)
    } catch (err) {
      console.log("uploadData catch error", err);
      throw err
    }
  }

  async function fetchData(opts = { interrupt: false, onProgress: () => {} }){
    assertConnection()

    const blocksTotal = (await getMemoryUsage())[0]
    const blockSize = 32
    const expectedLength = blocksTotal * blockSize

    let blocksReceived = 0
    let bytesReceived = 0
    let expectedMTUSize = 0
    let result = new Uint8Array(expectedLength)

    // console.log('expecting bytes', expectedLength)

    function nextBlock(){
      return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
          if (opts.interrupt){
            clearInterval(interval)
            notifyCallback = noop;
            reject(new InterruptException())
          }
        }, 1000)
        notifyCallback = (res) => {
          let blockNumber = new Uint32Array(res, 0, 1)[0]
          let block = new Uint8Array(res, 4)

          // console.log(blockNumber, block.byteLength, block)

          if (block.byteLength === 0){
            // drop value
            blocksReceived++
            return resolve(false)
          }

          if (blockNumber !== blocksReceived){
            return reject(new OutOfOrderException())
          }

          if (!expectedMTUSize){
            expectedMTUSize = block.byteLength
          }

          // if (block.byteLength !== expectedMTUSize){
          //   return reject(new Error('Incorrect block size received'))
          // }

          result.set(block, bytesReceived)
          notifyCallback = noop
          bytesReceived += block.byteLength
          blocksReceived++
          resolve(true)
        }

        ble.withPromises.writeWithoutResponse(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data_req,
          toBtValue(blocksReceived).buffer
        ).catch(err => {
          reject(err)
        })
      })
    }

    try {
      await sendCommand('startDataDownload')

      while(bytesReceived < expectedLength){
        if (opts.interrupt){
          throw new InterruptException()
        }

        try {
          await nextBlock()
        } catch (e){
          throw e
          // if it's out of order block, try again
          // if (!(e instanceof OutOfOrderException)){
          //   throw e
          // }
        }
        if (opts.onProgress){
          opts.onProgress(bytesReceived, expectedLength)
        }
      }

    } catch (err){
      throw err
    } finally {
      await sendCommand('stopDataDownload')
    }

    return result
  }

  return {
    connect,
    disconnect,
    getMemoryUsage,
    getBatteryLevel,
    sendCommand,
    setName,
    syncClock,
    recentData,
    uploadData,
    getDataRecent,
    fetchData,
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
