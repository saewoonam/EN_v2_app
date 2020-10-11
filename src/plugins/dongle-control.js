import Vue from 'vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from './dongle-config'
import sanitize from 'sanitize-filename'
import {rawRecentToData} from '../tools/data-parse'

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

      let timeout = setTimeout(() => {
        ble.stopNotification(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data
        )
        notifyCallback = noop
        reject(new Error('Command timed out before receiving response via notify'))
      }, COMMAND_TIMEOUT)

      function done(res) {
        clearTimeout(timeout)
        ble.stopNotification(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data
        )

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
        ble.startNotification(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data,
          done
        )
      }

      ble.withPromises.write(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.rw,
        toBtValue(command.value).buffer
      ).then(res => {
        if (!command.notify){
          done(res)
        }
      }).catch(err => {
        ble.stopNotification(
          connection.id,
          SERVICE_UUID,
          CHARACTERISTICS.data
        )
        notifyCallback = noop
        console.log("Error trying to send: ", command.value)
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

  async function getUptimeB(uptime) {
    console.log("in get uptimeB")
    let handleNotification = function(res){
      ble.stopNotification(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.data
      )
      let time = new Uint32Array(res)
      uptime[0] = time[0]
      uptime[1] = time[1]
      done = true;
    }
    ble.startNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      handleNotification
    )
    await sendCommand('getUptimeB')
  }

  async function syncClock(){
    assertConnection()

    let uptime = await sendCommand('getUptime')
    let value = new Uint32Array(3)
    value[0] = parseInt((new Date()).getTime() / 1000)
    value[1] = uptime[0]
    value[2] = uptime[1]
    // send clock info before set clock command
    await ble.withPromises.writeWithoutResponse(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      value.buffer
    )
    //  tell device to uses info in data buffer to set clock
    await sendCommand('setClock')
  }

  function checkForMarkOrHeader(raw) {
    // let dv = new DataView(raw)
    let offset = 4;
    //let t = dv.getUint32(offset, true); // little endian
    let t = new Uint32Array(raw, offset, 1)[0]; // little endian
    if (t > 0) {
      /* Check if mark, unmark, header, etc... */
      // let b = dv.getUint8(offset)
      let b = new Uint8Array(raw, offset, 1)[0];
      let index = offset;
      do {
        // if (b != dv.getUint8(index)) {
        if (b != new Uint8Array(raw, index, 1)[0]) {
          break;
        }
        index++;
      } while (index < offset + 32);
      if (index == offset + 32) {
        t = -1; // found a tag 
        console.log(" found tag");
      } else {}
      // check if first 4 bytes > 0, it is a timestamp
      if (t > 0) {
        return false;
      } else {
        return true;
      }
    }
  }

  function raw2row(raw) {
    let parsed = rawRecentToData(raw)
    let iqr_threshold = 100;
    let row = {}
    row.timestamp = new Date(parsed.minute * 60 * 1000).toLocaleString();
    row.sound = 2048;
    // console.log(parsed)
    let uSound = parsed.usound_data
    if (uSound.n > 10) {
      if (uSound.left_iqr < iqr_threshold) row.sound = uSound.left;
      if (uSound.right_iqr < iqr_threshold) row.sound = (uSound.right < row.sound) ?
        uSound.right : row.sound;
    }

    if (row.sound == 2048) {
      row.sound = 'NaN';
    } else {
      row.sound -= 50;
      row.sound *= 192 / 19e6 *
        343;
      row.sound = row.sound.toFixed(2);
    }

    let rssi = parsed.rssi_values
    row.rssi = rssi.reduce((acc, data) => acc + data, 0)
    let num = rssi.reduce((acc, data) => (data != 0) ? acc + 1 : acc, 0);
    row.rssi = (row.rssi/num).toFixed(1)
    return row;
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
        // row.timestamp = "today"
        // row.sound = local.length
        // console.log(local)
        // console.log(local.length)
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
    getUptimeB,
    recentData,
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
