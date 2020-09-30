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

'use strict';

var battery = {
    service: "180F",
    level: "2A19"
};

var nisten_ble = {
    shortUUID: 'fd6f',
    serviceUUID: '7b183224-9168-443e-a927-7aeea07e8105',
    rwCharacteristic: '56cd7757-5f47-4dcd-a787-07d648956068',
    countsCharacteristic: '292bd3d2-14ff-45ed-9343-55d125edb721',
    sppCharacteristic: 'fec26ec4-6d71-4442-9f81-55bc21d658d6',
    datainCharacteristic: '398d2a6c-b541-4160-b4b0-c59b4e27a1bb'
};

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

var app = {
    initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        deviceStateButton.addEventListener('touchstart', this.readDeviceState, false);
        fetchButton.addEventListener('touchstart', this.fetchState, false);
        A.addEventListener('touchstart', this.AButton, false);
        O.addEventListener('touchstart', this.OButton, false);
        disconnectButton.addEventListener('touchstart', this.disconnect, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empties the list
        // scan for all devices
        // ble.scan(['7b183224-9168-443e-a927-7aeea07e8105'], 5, app.onDiscoverDevice, app.onError);
        // ble.scan([nisten_ble.shortUUID], 5, app.onDiscoverDevice, app.onError);
        // ble.scan(['fd6f'], 5, app.onDiscoverDevice, app.onError);
        // ble.scan(['fd6f'], 5, app.onDiscoverDevice, app.onError);
        ble.scan([], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        // TODO add filter on RSSI to eliminate weak signals
        console.log(JSON.stringify(device.advertising));
        // console.log(device.name, device.advertising.slice(3,3+4));

        // let service = new Uint8Array([3, 2, 111, 253]);
        // let number = new Uint32Array(service.buffer);
        // let number2 = new Uint32Array(device.advertising.slice(3,7));
        // console.log(number[0], number2[0]);
        //
        // if ((number[0] == number2[0]) && (device.rssi>-80)) {
        // if (number[0] == number2[0]) {
        if (device.rssi > -80) {
            console.log(JSON.stringify(device));
            var listItem = document.createElement('li'),
                    html = '<b>' + device.name + '</b><br/>' +
                    'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                    device.id;

            listItem.dataset.deviceId = device.id;  // TODO
            listItem.innerHTML = html;
            deviceList.appendChild(listItem);
        }
    },
    sendCmd_promise: function(data) {
        app.log('sendCmd_promise: '+data);
        var cmd = stringToBytes(data);

        return new Promise(function(resolve, reject) {
            ble.write(
                app.deviceId,
                nisten_ble.serviceUUID,
                nisten_ble.rwCharacteristic,
                cmd, resolve, reject
            );
        });
    },
    sendSpp_promise: function(data) {
        // resultDiv.innerHTML = resultDiv.innerHTML + "sendSpp "+data.byteLength  + "<br/>";
        // resultDiv.scrollTop = resultDiv.scrollHeight;
        return new Promise(function(resolve, reject) {
            ble.writeWithoutResponse(  // ble.write does not work.
                app.deviceId,
                nisten_ble.serviceUUID,
                nisten_ble.sppCharacteristic,
                data, resolve, reject
            );
        });
    },
    log: function(msg,newline=true) {
        resultDiv.innerHTML = resultDiv.innerHTML + msg;
        if (newline) {
            resultDiv.innerHTML += "<br/>";
        }
        resultDiv.scrollTop = resultDiv.scrollHeight;
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId;
        resultDiv.innerHTML = "Trying to connect...";
        document.querySelectorAll('.disable').forEach(elem => {
            elem.disabled = true;
            // elem.style.visibility = 'visible';
        });
        app.showDetailPage();
        new Promise(function(resolve, reject) {
            ble.connect(deviceId, resolve, reject);
        })
            .then(_ => {
                app.deviceId = deviceId;
                document.querySelectorAll('.disable').forEach(elem => {
                    elem.disabled = false;
                    // elem.style.visibiliity = 'hidden';
                });
                // deviceStateButton.disabled = false;
                app.log("connected: "+ deviceId);
                app.readBattery(); // do this to prevent the device from disconnecting immediately... firmware bug
            })
            .catch(function(reason) {
                alert("ERROR: " + reason); // real apps should use notification.alert
                app.showMainPage();
            });
    },
    readPromise: function(service, characteristic) {
        return new Promise(function(resolve, reject) {
            ble.read(app.deviceId, service, characteristic, resolve, reject);
        });
    },
    readBattery: function() {
        app.log("readBattery");
        app.readPromise(nisten_ble.serviceUUID, battery.level)
            .then((data) => app.onReadBatteryLevel(data))
            .catch(app.onError);
    },
    readDeviceState: function(event) {
        app.log("readDeviceState");
        app.readPromise(nisten_ble.serviceUUID, nisten_ble.countsCharacteristic)
            .then(data => {
                app.onReadCount(data);
            })
            .then(_ => {
                if (app.status & 4) {
                    app.log("time needs to be set");
                    app.setTime();
                }
            })
            .catch(app.noError);
    },
    send_idx_promise: function() {
        let data = new Uint32Array(1);
        data[0] = app.fetch_idx;
        return app.sendSpp_promise(data.buffer);
    },
    fetchState: function(event) {
        app.log("fetchState");
        app.fetch_idx = 0;
        app.received_length = 0;

        app.log("fetchState start notify");
        ble.startNotification(app.deviceId, nisten_ble.serviceUUID, nisten_ble.sppCharacteristic, app.handlef, app.onError);

        app.readPromise(nisten_ble.serviceUUID, nisten_ble.countsCharacteristic)
            .then(data => {
                app.onReadCount(data);
                app.log("fetchState send cmd f");
                app.sendCmd_promise("f");
            })
            // .then(_ => { // this delay is needed on android 
            //     app.delay(50);
            // })
            // .then(_ => {
            //     app.send_idx_promise();
            // })
            .then(_ => {
                setTimeout(function() {app.send_idx_promise();}, 75);
            })
            .catch(app.onError);
    },
    handlef: function(data) {
        var array32 = new Uint32Array(data.slice(0,4));
        app.log('handlef info: '+array32[0]+ ', ', false);
        if (array32[0] == app.fetch_idx) {
            // should check packet_size... Leave for later
            if (array32[0] == 0) { // no concat if first packet
                // app.log('first packet');
                app.blob = new Uint8Array(app.counts<<5);
            }
            app.blob.set(new Uint8Array(data.slice(4,)), app.received_length);
        }
        app.received_length +=  data.byteLength - 4;
        app.log(' '+data.byteLength + ', ' + app.received_length + ', ' + (app.counts<<5));
        if (app.received_length==(app.counts<<5)) {
            ble.stopNotification(app.deviceId, nisten_ble.serviceUUID, nisten_ble.sppCharacteristic, app.donef, app.onError);
            // console.log(app.blob)
            // console.log('blob.length '+app.blob.length);
            app.log('blob.length '+app.blob.length);
        } else {
            app.fetch_idx = array32[0] + 1;
            app.send_idx_promise()
                .catch(app.onError);
        }
    },
    donef: function(event) {
        app.log('done f');
    },
    sendCmd: function(deviceId, data, success, failure ) {
        // resultDiv.innerHTML = resultDiv.innerHTML + "sendCmd "+ data  + "<br/>";
        // resultDiv.scrollTop = resultDiv.scrollHeight;
        app.log("sendCmd "+data);
        ble.write(
            deviceId,
            nisten_ble.serviceUUID,
            nisten_ble.rwCharacteristic,
            data, success, failure
        );
    },
    sendSpp: function(deviceId, data, success, failure ) {
        // resultDiv.innerHTML = resultDiv.innerHTML + "sendSpp "+data.byteLength  + "<br/>";
        // resultDiv.scrollTop = resultDiv.scrollHeight;
        app.log("sendSpp "+data.byteLength);
        ble.writeWithoutResponse(  // ble.write does not work.
            deviceId,
            nisten_ble.serviceUUID,
            nisten_ble.sppCharacteristic,
            data, success, failure
        );
    },
    delay: function(delay_ms) {
        new Promise((resolve, reject) => {

            let wait = setTimeout(() => {
                clearTimeout(wait);
                app.log('delay');
                resolve("done waiting");
            }, delay_ms)
        });
    },
    setTime_orig: function() {
        let times = new Uint32Array(3);
        let count = 0;
        let epoch_time1 = (new Date()).getTime();
        let epoch_time2;
        var finishedO = function() {
            app.log("Finished setting time");
        }
        var sendO = function() {
            var data = stringToBytes("O");
            // setTimeout(function() {app.sendCmd(app.deviceId, data, finishedO, app.onErr);}, 100);
            app.sendCmd(app.deviceId, data, finishedO, app.onError);
        };
        var doneA_orig = function() {
            app.sendSpp(app.deviceId, times.buffer, sendO, app.onErr);
        };
        var doneA = function() {
            setTimeout(function() {app.sendSpp(app.deviceId, times.buffer, sendO, app.onErr);}, 75);
        };
        var success = function() {
            // resultDiv.innerHTML = resultDiv.innerHTML + "Sent cmd A: <br/>";
            // resultDiv.scrollTop = resultDiv.scrollHeight;
        };
        var readA = function(buffer) {
            var data = new Uint32Array(buffer);
            times[count+1] = data[0]
            // resultDiv.innerHTML = resultDiv.innerHTML + "readA " + times[count] + "<br/>";
            // resultDiv.scrollTop = resultDiv.scrollHeight;
            count++;
            if (count==2) {
                epoch_time2 = (new Date()).getTime();

                let mean = parseInt((epoch_time1 + epoch_time2) / 2);
                let offset = mean % 1000;
                mean = parseInt(mean / 1000);
                times[0] = mean;
                times[1] -= offset;

                app.log("times: "+times);
                app.times = times;
                ble.stopNotification(app.deviceId, nisten_ble.serviceUUID,
                    nisten_ble.sppCharacteristic, doneA, app.onError);
            }
        }
        // resultDiv.innerHTML = resultDiv.innerHTML + "start to get uptime" + "<br/>";
        // resultDiv.scrollTop = resultDiv.scrollHeight;
        ble.startNotification(app.deviceId, nisten_ble.serviceUUID, nisten_ble.sppCharacteristic, readA, app.onError);
        var data = stringToBytes("A");
        app.sendCmd(app.deviceId, data, success, app.onError);
    },
    OButton: function() {
        app.doneA()
    },
    AButton: function() {
        app.log("not implemented");
    },
    doneA: function() {
        app.log("got times: "+app.times+" length:"+app.times.byteLength);
        // app.sendSpp_promise(times.buffer)
        //     .then(app.log("try to send times buffer"))
        //     .catch(app.onErr);
        //
        //  Tied to add a delay promise... delay via promise is not working
        //
        // app.delay(1000)
        //     .then((res) => app.log(res))
        //     .then(app.sendSpp_promise(app.times.buffer))
        //     .then(app.sendCmd_promise("O"))
        //     .then(app.log("finished trying to set time"))
        //     .catch(app.onErr);
        setTimeout(function() {
            app.sendSpp_promise(app.times.buffer)
                .then(app.sendCmd_promise("O"))
                .then(app.log("finished trying to set time"))
                .catch(app.onErr);
        }, 75);
    },

    setTime: function() {
        app.times = new Uint32Array(3);
        let count = 0;
        let epoch_time1 = (new Date()).getTime();
        let epoch_time2;

        var readA = function(buffer) {
            var data = new Uint32Array(buffer);
            app.times[count+1] = data[0]
            count++;
            if (count==2) {
                epoch_time2 = (new Date()).getTime();

                let mean = parseInt((epoch_time1 + epoch_time2) / 2);
                let offset = mean % 1000;
                mean = parseInt(mean / 1000);
                app.times[0] = mean;
                app.times[1] -= offset;
                app.log("stopping readA");
                app.log("got times: "+app.times+" length:"+app.times.byteLength);

                ble.stopNotification(app.deviceId, nisten_ble.serviceUUID,
                    nisten_ble.sppCharacteristic, app.doneA, app.onError);
            }
        }
        ble.startNotification(app.deviceId, nisten_ble.serviceUUID, nisten_ble.sppCharacteristic, readA, app.onError);
        app.sendCmd_promise("A")
            .catch(app.onError);
    },

    onReadBatteryLevel: function(data) {
        var message;
        var a = new Uint8Array(data);
        app.battery = a[0]
        app.log(a.toString('hex'));
        app.log('battery: '+app.battery);
    },
    onReadCount: function(data) {
        var a = new Uint8Array(data);
        app.status = a[3];
        var a = new Uint16Array(data);
        app.log(a.toString());
        app.counts = a[0];
        app.log('counts: '+a[0]);
    },
    disconnect: function(event) {
        var onError = function(error) {
            app.onError(error);
            app.showMainPage();
            app.refreshDeviceList();
        };
        var deviceId = event.target.dataset.deviceId;
        resultDiv.innerHTML = "";
        // ble.disconnect(app.deviceId, app.showMainPage, app.onError);
        ble.disconnect(app.deviceId, app.showMainPage, onError);
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};
