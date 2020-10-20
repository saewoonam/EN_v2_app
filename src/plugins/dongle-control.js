import Vue from 'vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from './dongle-config'
import sanitize from 'sanitize-filename'
import { raw2row, checkForMarkOrHeader, getDataFromView } from '../tools/data-parse'

const COMMAND_TIMEOUT = 5000
const noop = () => { }

function toBtValue(val) {
  if (typeof val === 'number') {
    let buf = new ArrayBuffer(4)
    let view = new DataView(buf)
    view.setUint32(0, val, true)
    return new Uint8Array(buf)
  }

  if (typeof val === 'string') {
    return Uint8Array.of(val.charCodeAt(0))
  }

  throw new Error('Can not encode value for bluetooth write')
}

export class OutOfOrderException extends Error {
  constructor() {
    super('Received block out of order')
  }
}

export class InterruptException extends Error {
  constructor() {
    super('Interrupted')
  }
}

function Controller() {
  // just using vue for events
  const pubsub = new Vue()
  let subscribed = false
  let connection = null
  let selection = null
  let notifyCallback = noop

  function assertConnection() {
    if (!connection) {
      throw new Error('No connection established')
    }
  }
  function unselect() {
    console.log("unselect")
    pubsub.$emit('unselected')
  }

  function select(name) {
    selection = name
    console.log("select this.selection: ", selection)
    pubsub.$emit('selected')
  }

  function trim(name) {
    if (name.length==8) {
      name = name.slice(-4)
    }
    if (name == '-GEN') {
      name = 'test'
    }
    return name
  }

  function match(name, found) {
    console.log('match in:', name, found)
    found = trim(found)
    let number = trim(name)
    console.log('match test:', number, found)
    return number==found
  }

  async function discover(name) {
    return new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        ble.stopScan()
        reject(new Error('discover scan timeout'))
      }, 2 * COMMAND_TIMEOUT)
      let error = function () {
        reject(new Error("discover failed to startScan"))
      }
      let discover = function(device) {
        console.log("scan found: ", device.name, selection, device.name==selection)
        if (match(selection, device.name)) {
          console.log("match found")
          clearTimeout(timeout)
          ble.stopScan()
          resolve(device)
        }
      }
      ble.startScan(['7b183224-9168-443e-a927-7aeea07e8105'], discover, error);
    })
  }

  async function disconnect() {
    if (!connection) { return }
    await unsubscribe()
    await ble.withPromises.disconnect(connection.id)
    connection = null
    console.log("Disconnected")
    pubsub.$emit('disconnected')
  }

  async function connect(deviceId) {
    if (!deviceId) {
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
        async (c) => {
          clearTimeout(timeout)
          connection = c
          await subscribe()
          pubsub.$emit('connected', connection)
          console.log('connect', c)
          resolve(c)
        },
        () => {
          connection = null
          pubsub.$emit('disconnected')
        }
      )
    })
  }

  async function subscribe() {
    assertConnection()
    if (subscribed) { return }
    ble.startNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data,
      (res) => {
        notifyCallback(res)
      }
    )

    subscribed = true
  }

  async function unsubscribe() {
    assertConnection()
    if (!subscribed) { return }
    await ble.withPromises.stopNotification(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.data
    )

    subscribed = false
  }

  async function getMemoryUsage() {
    assertConnection()

    let res = await ble.withPromises.read(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.count
    )

    let data = new Uint16Array(res)
    return data
  }

  async function getBatteryLevel() {
    assertConnection()

    let res = await ble.withPromises.read(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.battery
    )

    let a = new Uint8Array(res)
    return a[0]
  }

  function sendCommandPlain(name){
    const command = COMMANDS[name]

    if (!command) {
      return Promise.reject(new Error('No command named: ' + name))
    }

    return ble.withPromises.write(
      connection.id,
      SERVICE_UUID,
      CHARACTERISTICS.rw,
      toBtValue(command.value).buffer
    )
  }

  function sendCommand(name) {
    const command = COMMANDS[name]

    if (!command) {
      return Promise.reject(new Error('No command named: ' + name))
    }

    return new Promise((resolve, reject) => {
      assertConnection()

      let timeout = setTimeout(() => {
        notifyCallback = noop
        reject(new Error('Command timed out before receiving response'))
      }, COMMAND_TIMEOUT)

      function done(res) {
        console.log("clear timeout")
        clearTimeout(timeout)
        notifyCallback = noop

        try {
          let data = res ?
            new command.returnType(res) :
            []
          resolve(data)
        } catch (err) {
          reject(err)
        }
      }

      if (command.notify) {
        notifyCallback = done
      }

      ble.withPromises.write(
        connection.id,
        SERVICE_UUID,
        CHARACTERISTICS.rw,
        toBtValue(command.value).buffer
      ).then(res => {
        if (!command.notify) {
          done(res)
        }
      }).catch(err => {
        notifyCallback = noop

        reject(err)
      })

    })
  }

  async function setName(name) {
    assertConnection()
    if (name.length > 8) {
      throw new Error('Name must be less than 8 characters')
    }

    let value = new Uint8Array(8)
    for (let i = 0; i < name.length; i++) {
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

  async function syncClock() {
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

  async function fetchRecentData() {
    assertConnection()

    let data = []
    return new Promise((resolve, reject) => {
      notifyCallback = res => {
        try {
          let blockNumber = new Uint32Array(res, 0, 1)[0]
          console.log(blockNumber)

          if (blockNumber == 0xFFFFFFFF) {
            notifyCallback = noop
            resolve(data)
          } else {
            data.push(raw2row(res))
          }
        } catch( e ){
          reject(e)
        }
      }

      sendCommandPlain('recentData').catch(reject)
    }).finally(() => {
      notifyCallback = noop
    })
  }

  async function fetchData(opts = { interrupt: false, onProgress: () => { } }) {
    assertConnection()

    await sendCommand('startLastUpload')
    const blocksTotal = (await getMemoryUsage())[0]
    const blockSize = 32
    // const expectedLength = blocksTotal * blockSize
    // get start_mem has to come after getMemoryUssage, otherwise error
    const start_mem = (await sendCommand('getLastUpload'))[0]
    const expectedLength = (blocksTotal - start_mem) * blockSize

    let blocksReceived = 0
    let bytesReceived = 0
    let expectedMTUSize = 0
    let result = new Uint8Array(expectedLength)

    // console.log('expecting bytes', expectedLength)

    function nextBlock() {
      return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
          if (opts.interrupt) {
            clearInterval(interval)
            notifyCallback = noop;
            reject(new InterruptException())
          }
        }, 1000)
        notifyCallback = (res) => {
          let blockNumber = new Uint32Array(res, 0, 1)[0]
          let block = new Uint8Array(res, 4)

          // console.log(blockNumber, block.byteLength, block)

          if (block.byteLength === 0) {
            // drop value
            blocksReceived++
            return resolve(false)
          }

          if (blockNumber !== blocksReceived) {
            return reject(new OutOfOrderException())
          }

          if (!expectedMTUSize) {
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

      while (bytesReceived < expectedLength) {
        if (opts.interrupt) {
          throw new InterruptException()
        }

        try {
          await nextBlock()
        } catch (e) {
          throw e
          // if it's out of order block, try again
          // if (!(e instanceof OutOfOrderException)){
          //   throw e
          // }
        }
        if (opts.onProgress) {
          opts.onProgress(bytesReceived, expectedLength)
        }
      }

    } catch (err) {
      throw err
    } finally {
      await sendCommand('stopDataDownload')
    }

    let encounters = []
    for (let offset = 0; offset < result.byteLength; offset += blockSize) {
      let chunk = result.slice(offset, offset + blockSize);
      let check = checkForMarkOrHeader(chunk.buffer, 0)
      if (!check) {
        chunk = result.slice(offset, offset + 2 * blockSize);
        let dv = new DataView(chunk.buffer);
        let row = getDataFromView(dv)
        row.name = connection.name
        encounters.push(row)
        offset += blockSize
      }
    }

    return encounters
  }

  return {
    connect,
    disconnect,
    discover,
    select,
    unselect,
    getMemoryUsage,
    getBatteryLevel,
    sendCommand,
    setName,
    syncClock,
    fetchData,
    fetchRecentData,
    // getDeviceName: () => sanitize(connection.name || ''),
    getDeviceName: () => sanitize(selection || ''),
    isConnected: () => !!connection,
    isSelected: () => !!selection,
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
