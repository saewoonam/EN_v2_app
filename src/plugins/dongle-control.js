import Vue from 'vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from './dongle-config'
import sanitize from 'sanitize-filename'

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
  let subscribed = false
  let connection = null
  let notifyCallback = noop

  function assertConnection(){
    if (!connection){
      throw new Error('No connection established')
    }
  }

  async function disconnect(){
    if (!connection){ return }
    unsubscribe()
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
          subscribe()
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

  async function subscribe(){
    assertConnection()
    if (subscribed) { return }
    ble.startNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      (res) => {
        notifyCallback(res)
        notifyCallback = noop
      }
    )

    subscribed = true
  }

  async function unsubscribe(){
    assertConnection()
    if (!subscribed) { return }
    await ble.withPromises.stopNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data
    )

    subscribed = false
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

      let timeout = setTimeout(() => {
        notifyCallback = noop
        reject(new Error('Command timed out before receiving response via notify'))
      }, COMMAND_TIMEOUT)

      function done(res) {
        clearTimeout(timeout)
        notifyCallback = noop

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
        notifyCallback = done
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
        notifyCallback = noop

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
    let dv = new DataView(raw)
    let offset = 4;
    let t = dv.getUint32(offset, true); // little endian
    if (t > 0) {
      /* Check if mark, unmark, header, etc... */
      let b = dv.getUint8(offset)
      let index = offset;
      do {
        if (b != dv.getUint8(index)) {
          break;
        }
        index++;
      } while (index < offset + 32);
      if (index == offset + 32) {
        t = -1; // found a tag
        console.log(" found tag");
      } else {
    } // check if first 4 bytes> 0,it is a timestamp
      if (t>0) {
        return false;
      } else {
        return true;
      }
    }
  }

  function raw2row(raw) {
    let dv = new DataView(raw)
    let offset = 4;
    let t = dv.getUint32(offset, true);
    let row = {}
    row.timestamp = new Date(t * 60 * 1000).toLocaleString();
    let sound = new Uint16Array(raw.slice(offset + 12, offset + 12 + 8))
    let num = dv.getInt8(offset + 11)
    row.sound = 2048;
    if (num > 10) {
      if (sound[1] < iqr_threshold) row.sound = sound[0];
      if (sound[3] < iqr_threshold) row.sound = (sound[2] < row.sound) ?
        sound[2] : row.sound;
    }
    if (row.sound == 2048) {
      row.sound = 'NaN';
    } else {
      row.sound -= 50;
      row.sound *= 192 / 19e6 * 343;
      row.sound = row.sound.toFixed(2);
    }
    let rssi = new Int8Array(raw.slice(offset + 12 + 8, offset + 32))
    row.rssi = (rssi.reduce((acc, data) => acc + data, 0) /
      rssi.reduce((acc, data) => (data != 0) ? acc + 1 : acc, 0)).toFixed(1)
    return row;
  }

  async function recentData(opts = { interrupt: false, onProgress: () => {} }){
    assertConnection()

    let data = []
    let done = false;

    function nextEncounter() {
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
          // let block = new Uint8Array(res, 4)
          if (blockNumber == 0xFFFFFFFF) {
            // console.log("done with recent")
            notifyCallback = noop;
            done = true;
            // device.stopDataNotifications(handleDatae);
            // CreateTableFromJSON(data);
          } else {
            if (!checkForMarkOrHeader(raw)) {
              data.push(raw2row(res));
            }
          }
        }
      })
    }
    try {
      await sendCommand('recentData')

      while(!done){
        if (opts.interrupt){
          throw new InterruptException()
        }

        try {
          await nextEncounter()
        } catch (e){
          throw e
        }
        // if (opts.onProgress){
        //   opts.onProgress(bytesReceived, expectedLength)
        // }
      }

    } catch (err){
      throw err
    }

    return data;
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
