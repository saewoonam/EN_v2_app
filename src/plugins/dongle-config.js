export const SERVICE_UUID = '7b183224-9168-443e-a927-7aeea07e8105'
export const BROADCASTED_SERVICE_UUID = 'fd6f'

export const CHARACTERISTICS = Object.freeze({
  count: '292bd3d2-14ff-45ed-9343-55d125edb721',
  rw: '56cd7757-5f47-4dcd-a787-07d648956068',
  data: 'fec26ec4-6d71-4442-9f81-55bc21d658d6',
  data_req: '398d2a6c-b541-4160-b4b0-c59b4e27a1bb',
  battery: '2A19'
})

export const COMMANDS = Object.freeze({
  isWritingToFlash: {
    value: 'I',
    notify: true,
    returnType: Uint8Array
  },
  getUptime: {
    value: 'A',
    notify: true,
    returnType: Uint32Array
  },
  getLastUpload: {
    value: 'g',
    notify: true,
    returnType: Uint32Array
  },
  startLastUpload: {
    value: 'G',
    notify: false,
    returnType: Uint8Array
  },
  markFlashUpload: {
    value: 'Y',
    notify: false,
    returnType: Uint8Array
  },
  setClock: {
    value: 'O',
    notify: false,
    returnType: Uint8Array
  },
  startWritingToFlash: {
    value: 'w',
    notify: false,
    returnType: Uint8Array
  },
  stopWritingToFlash: {
    value: 's',
    notify: false,
    returnType: Uint8Array
  },
  setName: {
    value: 'N',
    notify: false,
    returnType: Uint8Array
  },
  recordPrimaryEncounterEvent: {
    value: 'M',
    notify: false,
    returnType: Uint8Array
  },
  recordSecondaryEncounterEvent: {
    value: 'U',
    notify: false,
    returnType: Uint8Array
  },
  recentData: {
    value: 'e',
    notify: false,
    returnType: Uint8Array
  },
  startDataDownload: {
    value: 'f',
    notify: false,
    returnType: Uint8Array
  },
  stopDataDownload: {
    value: 'F',
    notify: false,
    returnType: Uint8Array
  },
  eraseFlash: {
    value: 'C',
    notify: false,
    returnType: Uint8Array
  }
})
