/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
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

app.initialize();

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7QUFFYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxPQUFPO0FBQzdDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkUsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsT0FBTztBQUMzRDs7QUFFQSxrREFBa0Q7QUFDbEQ7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGtDQUFrQztBQUNsQyxhQUFhO0FBQ2I7QUFDQSwwQ0FBMEM7QUFDMUM7QUFDQSxhQUFhO0FBQ2IsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDJCQUEyQjtBQUMzQjtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0EsdUNBQXVDLHdCQUF3QjtBQUMvRCxhQUFhO0FBQ2I7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQztBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsdURBQXVEO0FBQzdGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQywyREFBMkQ7QUFDOUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLGtDQUFrQztBQUNsQztBQUNBOztBQUVBLGlCIiwiZmlsZSI6ImluZGV4LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiLy8gKGMpIDIwMjAgU2FlIFdvbyBOYW1cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cblxuLy8gQmFzZWQgb24gY29kZSB3cml0dGVuIGJ5IERvbiBDb2xlbWFuIGZyb20gaGlzIGNvcmRvdmEgYmxlIGNlbnRyYWwgcGFja2FnZVxuLy9cbi8vXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGJhdHRlcnkgPSB7XG4gICAgc2VydmljZTogXCIxODBGXCIsXG4gICAgbGV2ZWw6IFwiMkExOVwiXG59O1xuXG52YXIgbmlzdGVuX2JsZSA9IHtcbiAgICBzaG9ydFVVSUQ6ICdmZDZmJyxcbiAgICBzZXJ2aWNlVVVJRDogJzdiMTgzMjI0LTkxNjgtNDQzZS1hOTI3LTdhZWVhMDdlODEwNScsXG4gICAgcndDaGFyYWN0ZXJpc3RpYzogJzU2Y2Q3NzU3LTVmNDctNGRjZC1hNzg3LTA3ZDY0ODk1NjA2OCcsXG4gICAgY291bnRzQ2hhcmFjdGVyaXN0aWM6ICcyOTJiZDNkMi0xNGZmLTQ1ZWQtOTM0My01NWQxMjVlZGI3MjEnLFxuICAgIHNwcENoYXJhY3RlcmlzdGljOiAnZmVjMjZlYzQtNmQ3MS00NDQyLTlmODEtNTViYzIxZDY1OGQ2JyxcbiAgICBkYXRhaW5DaGFyYWN0ZXJpc3RpYzogJzM5OGQyYTZjLWI1NDEtNDE2MC1iNGIwLWM1OWI0ZTI3YTFiYidcbn07XG5cbi8vIEFTQ0lJIG9ubHlcbmZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoYnVmZmVyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSk7XG59XG5cbi8vIEFTQ0lJIG9ubHlcbmZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMoc3RyaW5nKSB7XG4gICAgdmFyIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoc3RyaW5nLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdHJpbmcubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGFycmF5W2ldID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheS5idWZmZXI7XG59XG5cbnZhciBhcHAgPSB7XG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgICAgICBkZXRhaWxQYWdlLmhpZGRlbiA9IHRydWU7XG4gICAgfSxcbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCB0aGlzLm9uRGV2aWNlUmVhZHksIGZhbHNlKTtcbiAgICAgICAgcmVmcmVzaEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5yZWZyZXNoRGV2aWNlTGlzdCwgZmFsc2UpO1xuICAgICAgICBkZXZpY2VTdGF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5yZWFkRGV2aWNlU3RhdGUsIGZhbHNlKTtcbiAgICAgICAgZmV0Y2hCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuZmV0Y2hTdGF0ZSwgZmFsc2UpO1xuICAgICAgICBBLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLkFCdXR0b24sIGZhbHNlKTtcbiAgICAgICAgTy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5PQnV0dG9uLCBmYWxzZSk7XG4gICAgICAgIGRpc2Nvbm5lY3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuZGlzY29ubmVjdCwgZmFsc2UpO1xuICAgICAgICBkZXZpY2VMaXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLmNvbm5lY3QsIGZhbHNlKTsgLy8gYXNzdW1lIG5vdCBzY3JvbGxpbmdcbiAgICB9LFxuICAgIG9uRGV2aWNlUmVhZHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHAucmVmcmVzaERldmljZUxpc3QoKTtcbiAgICB9LFxuICAgIHJlZnJlc2hEZXZpY2VMaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGV2aWNlTGlzdC5pbm5lckhUTUwgPSAnJzsgLy8gZW1wdGllcyB0aGUgbGlzdFxuICAgICAgICAvLyBzY2FuIGZvciBhbGwgZGV2aWNlc1xuICAgICAgICAvLyBibGUuc2NhbihbJzdiMTgzMjI0LTkxNjgtNDQzZS1hOTI3LTdhZWVhMDdlODEwNSddLCA1LCBhcHAub25EaXNjb3ZlckRldmljZSwgYXBwLm9uRXJyb3IpO1xuICAgICAgICAvLyBibGUuc2NhbihbbmlzdGVuX2JsZS5zaG9ydFVVSURdLCA1LCBhcHAub25EaXNjb3ZlckRldmljZSwgYXBwLm9uRXJyb3IpO1xuICAgICAgICAvLyBibGUuc2NhbihbJ2ZkNmYnXSwgNSwgYXBwLm9uRGlzY292ZXJEZXZpY2UsIGFwcC5vbkVycm9yKTtcbiAgICAgICAgLy8gYmxlLnNjYW4oWydmZDZmJ10sIDUsIGFwcC5vbkRpc2NvdmVyRGV2aWNlLCBhcHAub25FcnJvcik7XG4gICAgICAgIGJsZS5zY2FuKFtdLCA1LCBhcHAub25EaXNjb3ZlckRldmljZSwgYXBwLm9uRXJyb3IpO1xuICAgIH0sXG4gICAgb25EaXNjb3ZlckRldmljZTogZnVuY3Rpb24oZGV2aWNlKSB7XG4gICAgICAgIC8vIFRPRE8gYWRkIGZpbHRlciBvbiBSU1NJIHRvIGVsaW1pbmF0ZSB3ZWFrIHNpZ25hbHNcbiAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZGV2aWNlLmFkdmVydGlzaW5nKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRldmljZS5uYW1lLCBkZXZpY2UuYWR2ZXJ0aXNpbmcuc2xpY2UoMywzKzQpKTtcblxuICAgICAgICAvLyBsZXQgc2VydmljZSA9IG5ldyBVaW50OEFycmF5KFszLCAyLCAxMTEsIDI1M10pO1xuICAgICAgICAvLyBsZXQgbnVtYmVyID0gbmV3IFVpbnQzMkFycmF5KHNlcnZpY2UuYnVmZmVyKTtcbiAgICAgICAgLy8gbGV0IG51bWJlcjIgPSBuZXcgVWludDMyQXJyYXkoZGV2aWNlLmFkdmVydGlzaW5nLnNsaWNlKDMsNykpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhudW1iZXJbMF0sIG51bWJlcjJbMF0pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBpZiAoKG51bWJlclswXSA9PSBudW1iZXIyWzBdKSAmJiAoZGV2aWNlLnJzc2k+LTgwKSkge1xuICAgICAgICAvLyBpZiAobnVtYmVyWzBdID09IG51bWJlcjJbMF0pIHtcbiAgICAgICAgaWYgKGRldmljZS5yc3NpID4gLTgwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShkZXZpY2UpKTtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyksXG4gICAgICAgICAgICAgICAgICAgIGh0bWwgPSAnPGI+JyArIGRldmljZS5uYW1lICsgJzwvYj48YnIvPicgK1xuICAgICAgICAgICAgICAgICAgICAnUlNTSTogJyArIGRldmljZS5yc3NpICsgJyZuYnNwO3wmbmJzcDsnICtcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlLmlkO1xuXG4gICAgICAgICAgICBsaXN0SXRlbS5kYXRhc2V0LmRldmljZUlkID0gZGV2aWNlLmlkOyAgLy8gVE9ET1xuICAgICAgICAgICAgbGlzdEl0ZW0uaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgICAgIGRldmljZUxpc3QuYXBwZW5kQ2hpbGQobGlzdEl0ZW0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZW5kQ21kX3Byb21pc2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgYXBwLmxvZygnc2VuZENtZF9wcm9taXNlOiAnK2RhdGEpO1xuICAgICAgICB2YXIgY21kID0gc3RyaW5nVG9CeXRlcyhkYXRhKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBibGUud3JpdGUoXG4gICAgICAgICAgICAgICAgYXBwLmRldmljZUlkLFxuICAgICAgICAgICAgICAgIG5pc3Rlbl9ibGUuc2VydmljZVVVSUQsXG4gICAgICAgICAgICAgICAgbmlzdGVuX2JsZS5yd0NoYXJhY3RlcmlzdGljLFxuICAgICAgICAgICAgICAgIGNtZCwgcmVzb2x2ZSwgcmVqZWN0XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNlbmRTcHBfcHJvbWlzZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyByZXN1bHREaXYuaW5uZXJIVE1MID0gcmVzdWx0RGl2LmlubmVySFRNTCArIFwic2VuZFNwcCBcIitkYXRhLmJ5dGVMZW5ndGggICsgXCI8YnIvPlwiO1xuICAgICAgICAvLyByZXN1bHREaXYuc2Nyb2xsVG9wID0gcmVzdWx0RGl2LnNjcm9sbEhlaWdodDtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgYmxlLndyaXRlV2l0aG91dFJlc3BvbnNlKCAgLy8gYmxlLndyaXRlIGRvZXMgbm90IHdvcmsuXG4gICAgICAgICAgICAgICAgYXBwLmRldmljZUlkLFxuICAgICAgICAgICAgICAgIG5pc3Rlbl9ibGUuc2VydmljZVVVSUQsXG4gICAgICAgICAgICAgICAgbmlzdGVuX2JsZS5zcHBDaGFyYWN0ZXJpc3RpYyxcbiAgICAgICAgICAgICAgICBkYXRhLCByZXNvbHZlLCByZWplY3RcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgbG9nOiBmdW5jdGlvbihtc2csbmV3bGluZT10cnVlKSB7XG4gICAgICAgIHJlc3VsdERpdi5pbm5lckhUTUwgPSByZXN1bHREaXYuaW5uZXJIVE1MICsgbXNnO1xuICAgICAgICBpZiAobmV3bGluZSkge1xuICAgICAgICAgICAgcmVzdWx0RGl2LmlubmVySFRNTCArPSBcIjxici8+XCI7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0RGl2LnNjcm9sbFRvcCA9IHJlc3VsdERpdi5zY3JvbGxIZWlnaHQ7XG4gICAgfSxcbiAgICBjb25uZWN0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXZpY2VJZCA9IGUudGFyZ2V0LmRhdGFzZXQuZGV2aWNlSWQ7XG4gICAgICAgIHJlc3VsdERpdi5pbm5lckhUTUwgPSBcIlRyeWluZyB0byBjb25uZWN0Li4uXCI7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5kaXNhYmxlJykuZm9yRWFjaChlbGVtID0+IHtcbiAgICAgICAgICAgIGVsZW0uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gZWxlbS5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICB9KTtcbiAgICAgICAgYXBwLnNob3dEZXRhaWxQYWdlKCk7XG4gICAgICAgIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgYmxlLmNvbm5lY3QoZGV2aWNlSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihfID0+IHtcbiAgICAgICAgICAgICAgICBhcHAuZGV2aWNlSWQgPSBkZXZpY2VJZDtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZGlzYWJsZScpLmZvckVhY2goZWxlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZWxlbS5zdHlsZS52aXNpYmlsaWl0eSA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIGRldmljZVN0YXRlQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYXBwLmxvZyhcImNvbm5lY3RlZDogXCIrIGRldmljZUlkKTtcbiAgICAgICAgICAgICAgICBhcHAucmVhZEJhdHRlcnkoKTsgLy8gZG8gdGhpcyB0byBwcmV2ZW50IHRoZSBkZXZpY2UgZnJvbSBkaXNjb25uZWN0aW5nIGltbWVkaWF0ZWx5Li4uIGZpcm13YXJlIGJ1Z1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICAgICAgICBhbGVydChcIkVSUk9SOiBcIiArIHJlYXNvbik7IC8vIHJlYWwgYXBwcyBzaG91bGQgdXNlIG5vdGlmaWNhdGlvbi5hbGVydFxuICAgICAgICAgICAgICAgIGFwcC5zaG93TWFpblBhZ2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVhZFByb21pc2U6IGZ1bmN0aW9uKHNlcnZpY2UsIGNoYXJhY3RlcmlzdGljKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGJsZS5yZWFkKGFwcC5kZXZpY2VJZCwgc2VydmljZSwgY2hhcmFjdGVyaXN0aWMsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgcmVhZEJhdHRlcnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHAubG9nKFwicmVhZEJhdHRlcnlcIik7XG4gICAgICAgIGFwcC5yZWFkUHJvbWlzZShuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELCBiYXR0ZXJ5LmxldmVsKVxuICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IGFwcC5vblJlYWRCYXR0ZXJ5TGV2ZWwoZGF0YSkpXG4gICAgICAgICAgICAuY2F0Y2goYXBwLm9uRXJyb3IpO1xuICAgIH0sXG4gICAgcmVhZERldmljZVN0YXRlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBhcHAubG9nKFwicmVhZERldmljZVN0YXRlXCIpO1xuICAgICAgICBhcHAucmVhZFByb21pc2UobmlzdGVuX2JsZS5zZXJ2aWNlVVVJRCwgbmlzdGVuX2JsZS5jb3VudHNDaGFyYWN0ZXJpc3RpYylcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIGFwcC5vblJlYWRDb3VudChkYXRhKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihfID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYXBwLnN0YXR1cyAmIDQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwLmxvZyhcInRpbWUgbmVlZHMgdG8gYmUgc2V0XCIpO1xuICAgICAgICAgICAgICAgICAgICBhcHAuc2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goYXBwLm5vRXJyb3IpO1xuICAgIH0sXG4gICAgc2VuZF9pZHhfcHJvbWlzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBkYXRhID0gbmV3IFVpbnQzMkFycmF5KDEpO1xuICAgICAgICBkYXRhWzBdID0gYXBwLmZldGNoX2lkeDtcbiAgICAgICAgcmV0dXJuIGFwcC5zZW5kU3BwX3Byb21pc2UoZGF0YS5idWZmZXIpO1xuICAgIH0sXG4gICAgZmV0Y2hTdGF0ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgYXBwLmxvZyhcImZldGNoU3RhdGVcIik7XG4gICAgICAgIGFwcC5mZXRjaF9pZHggPSAwO1xuICAgICAgICBhcHAucmVjZWl2ZWRfbGVuZ3RoID0gMDtcblxuICAgICAgICBhcHAubG9nKFwiZmV0Y2hTdGF0ZSBzdGFydCBub3RpZnlcIik7XG4gICAgICAgIGJsZS5zdGFydE5vdGlmaWNhdGlvbihhcHAuZGV2aWNlSWQsIG5pc3Rlbl9ibGUuc2VydmljZVVVSUQsIG5pc3Rlbl9ibGUuc3BwQ2hhcmFjdGVyaXN0aWMsIGFwcC5oYW5kbGVmLCBhcHAub25FcnJvcik7XG5cbiAgICAgICAgYXBwLnJlYWRQcm9taXNlKG5pc3Rlbl9ibGUuc2VydmljZVVVSUQsIG5pc3Rlbl9ibGUuY291bnRzQ2hhcmFjdGVyaXN0aWMpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICBhcHAub25SZWFkQ291bnQoZGF0YSk7XG4gICAgICAgICAgICAgICAgYXBwLmxvZyhcImZldGNoU3RhdGUgc2VuZCBjbWQgZlwiKTtcbiAgICAgICAgICAgICAgICBhcHAuc2VuZENtZF9wcm9taXNlKFwiZlwiKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyAudGhlbihfID0+IHsgLy8gdGhpcyBkZWxheSBpcyBuZWVkZWQgb24gYW5kcm9pZFxuICAgICAgICAgICAgLy8gICAgIGFwcC5kZWxheSg1MCk7XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICAgICAgLy8gLnRoZW4oXyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgYXBwLnNlbmRfaWR4X3Byb21pc2UoKTtcbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAudGhlbihfID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge2FwcC5zZW5kX2lkeF9wcm9taXNlKCk7fSwgNzUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChhcHAub25FcnJvcik7XG4gICAgfSxcbiAgICBoYW5kbGVmOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBhcnJheTMyID0gbmV3IFVpbnQzMkFycmF5KGRhdGEuc2xpY2UoMCw0KSk7XG4gICAgICAgIGFwcC5sb2coJ2hhbmRsZWYgaW5mbzogJythcnJheTMyWzBdKyAnLCAnLCBmYWxzZSk7XG4gICAgICAgIGlmIChhcnJheTMyWzBdID09IGFwcC5mZXRjaF9pZHgpIHtcbiAgICAgICAgICAgIC8vIHNob3VsZCBjaGVjayBwYWNrZXRfc2l6ZS4uLiBMZWF2ZSBmb3IgbGF0ZXJcbiAgICAgICAgICAgIGlmIChhcnJheTMyWzBdID09IDApIHsgLy8gbm8gY29uY2F0IGlmIGZpcnN0IHBhY2tldFxuICAgICAgICAgICAgICAgIC8vIGFwcC5sb2coJ2ZpcnN0IHBhY2tldCcpO1xuICAgICAgICAgICAgICAgIGFwcC5ibG9iID0gbmV3IFVpbnQ4QXJyYXkoYXBwLmNvdW50czw8NSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcHAuYmxvYi5zZXQobmV3IFVpbnQ4QXJyYXkoZGF0YS5zbGljZSg0LCkpLCBhcHAucmVjZWl2ZWRfbGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICBhcHAucmVjZWl2ZWRfbGVuZ3RoICs9ICBkYXRhLmJ5dGVMZW5ndGggLSA0O1xuICAgICAgICBhcHAubG9nKCcgJytkYXRhLmJ5dGVMZW5ndGggKyAnLCAnICsgYXBwLnJlY2VpdmVkX2xlbmd0aCArICcsICcgKyAoYXBwLmNvdW50czw8NSkpO1xuICAgICAgICBpZiAoYXBwLnJlY2VpdmVkX2xlbmd0aD09KGFwcC5jb3VudHM8PDUpKSB7XG4gICAgICAgICAgICBibGUuc3RvcE5vdGlmaWNhdGlvbihhcHAuZGV2aWNlSWQsIG5pc3Rlbl9ibGUuc2VydmljZVVVSUQsIG5pc3Rlbl9ibGUuc3BwQ2hhcmFjdGVyaXN0aWMsIGFwcC5kb25lZiwgYXBwLm9uRXJyb3IpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXBwLmJsb2IpXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYmxvYi5sZW5ndGggJythcHAuYmxvYi5sZW5ndGgpO1xuICAgICAgICAgICAgYXBwLmxvZygnYmxvYi5sZW5ndGggJythcHAuYmxvYi5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwLmZldGNoX2lkeCA9IGFycmF5MzJbMF0gKyAxO1xuICAgICAgICAgICAgYXBwLnNlbmRfaWR4X3Byb21pc2UoKVxuICAgICAgICAgICAgICAgIC5jYXRjaChhcHAub25FcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRvbmVmOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBhcHAubG9nKCdkb25lIGYnKTtcbiAgICB9LFxuICAgIHNlbmRDbWQ6IGZ1bmN0aW9uKGRldmljZUlkLCBkYXRhLCBzdWNjZXNzLCBmYWlsdXJlICkge1xuICAgICAgICAvLyByZXN1bHREaXYuaW5uZXJIVE1MID0gcmVzdWx0RGl2LmlubmVySFRNTCArIFwic2VuZENtZCBcIisgZGF0YSAgKyBcIjxici8+XCI7XG4gICAgICAgIC8vIHJlc3VsdERpdi5zY3JvbGxUb3AgPSByZXN1bHREaXYuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICBhcHAubG9nKFwic2VuZENtZCBcIitkYXRhKTtcbiAgICAgICAgYmxlLndyaXRlKFxuICAgICAgICAgICAgZGV2aWNlSWQsXG4gICAgICAgICAgICBuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELFxuICAgICAgICAgICAgbmlzdGVuX2JsZS5yd0NoYXJhY3RlcmlzdGljLFxuICAgICAgICAgICAgZGF0YSwgc3VjY2VzcywgZmFpbHVyZVxuICAgICAgICApO1xuICAgIH0sXG4gICAgc2VuZFNwcDogZnVuY3Rpb24oZGV2aWNlSWQsIGRhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUgKSB7XG4gICAgICAgIC8vIHJlc3VsdERpdi5pbm5lckhUTUwgPSByZXN1bHREaXYuaW5uZXJIVE1MICsgXCJzZW5kU3BwIFwiK2RhdGEuYnl0ZUxlbmd0aCAgKyBcIjxici8+XCI7XG4gICAgICAgIC8vIHJlc3VsdERpdi5zY3JvbGxUb3AgPSByZXN1bHREaXYuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICBhcHAubG9nKFwic2VuZFNwcCBcIitkYXRhLmJ5dGVMZW5ndGgpO1xuICAgICAgICBibGUud3JpdGVXaXRob3V0UmVzcG9uc2UoICAvLyBibGUud3JpdGUgZG9lcyBub3Qgd29yay5cbiAgICAgICAgICAgIGRldmljZUlkLFxuICAgICAgICAgICAgbmlzdGVuX2JsZS5zZXJ2aWNlVVVJRCxcbiAgICAgICAgICAgIG5pc3Rlbl9ibGUuc3BwQ2hhcmFjdGVyaXN0aWMsXG4gICAgICAgICAgICBkYXRhLCBzdWNjZXNzLCBmYWlsdXJlXG4gICAgICAgICk7XG4gICAgfSxcbiAgICBkZWxheTogZnVuY3Rpb24oZGVsYXlfbXMpIHtcbiAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgd2FpdCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh3YWl0KTtcbiAgICAgICAgICAgICAgICBhcHAubG9nKCdkZWxheScpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoXCJkb25lIHdhaXRpbmdcIik7XG4gICAgICAgICAgICB9LCBkZWxheV9tcylcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXRUaW1lX29yaWc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgdGltZXMgPSBuZXcgVWludDMyQXJyYXkoMyk7XG4gICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgIGxldCBlcG9jaF90aW1lMSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCBlcG9jaF90aW1lMjtcbiAgICAgICAgdmFyIGZpbmlzaGVkTyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXBwLmxvZyhcIkZpbmlzaGVkIHNldHRpbmcgdGltZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VuZE8gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gc3RyaW5nVG9CeXRlcyhcIk9cIik7XG4gICAgICAgICAgICAvLyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge2FwcC5zZW5kQ21kKGFwcC5kZXZpY2VJZCwgZGF0YSwgZmluaXNoZWRPLCBhcHAub25FcnIpO30sIDEwMCk7XG4gICAgICAgICAgICBhcHAuc2VuZENtZChhcHAuZGV2aWNlSWQsIGRhdGEsIGZpbmlzaGVkTywgYXBwLm9uRXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZG9uZUFfb3JpZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXBwLnNlbmRTcHAoYXBwLmRldmljZUlkLCB0aW1lcy5idWZmZXIsIHNlbmRPLCBhcHAub25FcnIpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZG9uZUEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7YXBwLnNlbmRTcHAoYXBwLmRldmljZUlkLCB0aW1lcy5idWZmZXIsIHNlbmRPLCBhcHAub25FcnIpO30sIDc1KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHJlc3VsdERpdi5pbm5lckhUTUwgPSByZXN1bHREaXYuaW5uZXJIVE1MICsgXCJTZW50IGNtZCBBOiA8YnIvPlwiO1xuICAgICAgICAgICAgLy8gcmVzdWx0RGl2LnNjcm9sbFRvcCA9IHJlc3VsdERpdi5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZWFkQSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcbiAgICAgICAgICAgIHRpbWVzW2NvdW50KzFdID0gZGF0YVswXVxuICAgICAgICAgICAgLy8gcmVzdWx0RGl2LmlubmVySFRNTCA9IHJlc3VsdERpdi5pbm5lckhUTUwgKyBcInJlYWRBIFwiICsgdGltZXNbY291bnRdICsgXCI8YnIvPlwiO1xuICAgICAgICAgICAgLy8gcmVzdWx0RGl2LnNjcm9sbFRvcCA9IHJlc3VsdERpdi5zY3JvbGxIZWlnaHQ7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgaWYgKGNvdW50PT0yKSB7XG4gICAgICAgICAgICAgICAgZXBvY2hfdGltZTIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAgICAgbGV0IG1lYW4gPSBwYXJzZUludCgoZXBvY2hfdGltZTEgKyBlcG9jaF90aW1lMikgLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gbWVhbiAlIDEwMDA7XG4gICAgICAgICAgICAgICAgbWVhbiA9IHBhcnNlSW50KG1lYW4gLyAxMDAwKTtcbiAgICAgICAgICAgICAgICB0aW1lc1swXSA9IG1lYW47XG4gICAgICAgICAgICAgICAgdGltZXNbMV0gLT0gb2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgYXBwLmxvZyhcInRpbWVzOiBcIit0aW1lcyk7XG4gICAgICAgICAgICAgICAgYXBwLnRpbWVzID0gdGltZXM7XG4gICAgICAgICAgICAgICAgYmxlLnN0b3BOb3RpZmljYXRpb24oYXBwLmRldmljZUlkLCBuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELFxuICAgICAgICAgICAgICAgICAgICBuaXN0ZW5fYmxlLnNwcENoYXJhY3RlcmlzdGljLCBkb25lQSwgYXBwLm9uRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlc3VsdERpdi5pbm5lckhUTUwgPSByZXN1bHREaXYuaW5uZXJIVE1MICsgXCJzdGFydCB0byBnZXQgdXB0aW1lXCIgKyBcIjxici8+XCI7XG4gICAgICAgIC8vIHJlc3VsdERpdi5zY3JvbGxUb3AgPSByZXN1bHREaXYuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICBibGUuc3RhcnROb3RpZmljYXRpb24oYXBwLmRldmljZUlkLCBuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELCBuaXN0ZW5fYmxlLnNwcENoYXJhY3RlcmlzdGljLCByZWFkQSwgYXBwLm9uRXJyb3IpO1xuICAgICAgICB2YXIgZGF0YSA9IHN0cmluZ1RvQnl0ZXMoXCJBXCIpO1xuICAgICAgICBhcHAuc2VuZENtZChhcHAuZGV2aWNlSWQsIGRhdGEsIHN1Y2Nlc3MsIGFwcC5vbkVycm9yKTtcbiAgICB9LFxuICAgIE9CdXR0b246IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHAuZG9uZUEoKVxuICAgIH0sXG4gICAgQUJ1dHRvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwcC5sb2coXCJub3QgaW1wbGVtZW50ZWRcIik7XG4gICAgfSxcbiAgICBkb25lQTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwcC5sb2coXCJnb3QgdGltZXM6IFwiK2FwcC50aW1lcytcIiBsZW5ndGg6XCIrYXBwLnRpbWVzLmJ5dGVMZW5ndGgpO1xuICAgICAgICAvLyBhcHAuc2VuZFNwcF9wcm9taXNlKHRpbWVzLmJ1ZmZlcilcbiAgICAgICAgLy8gICAgIC50aGVuKGFwcC5sb2coXCJ0cnkgdG8gc2VuZCB0aW1lcyBidWZmZXJcIikpXG4gICAgICAgIC8vICAgICAuY2F0Y2goYXBwLm9uRXJyKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gIFRpZWQgdG8gYWRkIGEgZGVsYXkgcHJvbWlzZS4uLiBkZWxheSB2aWEgcHJvbWlzZSBpcyBub3Qgd29ya2luZ1xuICAgICAgICAvL1xuICAgICAgICAvLyBhcHAuZGVsYXkoMTAwMClcbiAgICAgICAgLy8gICAgIC50aGVuKChyZXMpID0+IGFwcC5sb2cocmVzKSlcbiAgICAgICAgLy8gICAgIC50aGVuKGFwcC5zZW5kU3BwX3Byb21pc2UoYXBwLnRpbWVzLmJ1ZmZlcikpXG4gICAgICAgIC8vICAgICAudGhlbihhcHAuc2VuZENtZF9wcm9taXNlKFwiT1wiKSlcbiAgICAgICAgLy8gICAgIC50aGVuKGFwcC5sb2coXCJmaW5pc2hlZCB0cnlpbmcgdG8gc2V0IHRpbWVcIikpXG4gICAgICAgIC8vICAgICAuY2F0Y2goYXBwLm9uRXJyKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGFwcC5zZW5kU3BwX3Byb21pc2UoYXBwLnRpbWVzLmJ1ZmZlcilcbiAgICAgICAgICAgICAgICAudGhlbihhcHAuc2VuZENtZF9wcm9taXNlKFwiT1wiKSlcbiAgICAgICAgICAgICAgICAudGhlbihhcHAubG9nKFwiZmluaXNoZWQgdHJ5aW5nIHRvIHNldCB0aW1lXCIpKVxuICAgICAgICAgICAgICAgIC5jYXRjaChhcHAub25FcnIpO1xuICAgICAgICB9LCA3NSk7XG4gICAgfSxcblxuICAgIHNldFRpbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHAudGltZXMgPSBuZXcgVWludDMyQXJyYXkoMyk7XG4gICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgIGxldCBlcG9jaF90aW1lMSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCBlcG9jaF90aW1lMjtcblxuICAgICAgICB2YXIgcmVhZEEgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlcik7XG4gICAgICAgICAgICBhcHAudGltZXNbY291bnQrMV0gPSBkYXRhWzBdXG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgaWYgKGNvdW50PT0yKSB7XG4gICAgICAgICAgICAgICAgZXBvY2hfdGltZTIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAgICAgbGV0IG1lYW4gPSBwYXJzZUludCgoZXBvY2hfdGltZTEgKyBlcG9jaF90aW1lMikgLyAyKTtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gbWVhbiAlIDEwMDA7XG4gICAgICAgICAgICAgICAgbWVhbiA9IHBhcnNlSW50KG1lYW4gLyAxMDAwKTtcbiAgICAgICAgICAgICAgICBhcHAudGltZXNbMF0gPSBtZWFuO1xuICAgICAgICAgICAgICAgIGFwcC50aW1lc1sxXSAtPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgYXBwLmxvZyhcInN0b3BwaW5nIHJlYWRBXCIpO1xuICAgICAgICAgICAgICAgIGFwcC5sb2coXCJnb3QgdGltZXM6IFwiK2FwcC50aW1lcytcIiBsZW5ndGg6XCIrYXBwLnRpbWVzLmJ5dGVMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgYmxlLnN0b3BOb3RpZmljYXRpb24oYXBwLmRldmljZUlkLCBuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELFxuICAgICAgICAgICAgICAgICAgICBuaXN0ZW5fYmxlLnNwcENoYXJhY3RlcmlzdGljLCBhcHAuZG9uZUEsIGFwcC5vbkVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBibGUuc3RhcnROb3RpZmljYXRpb24oYXBwLmRldmljZUlkLCBuaXN0ZW5fYmxlLnNlcnZpY2VVVUlELCBuaXN0ZW5fYmxlLnNwcENoYXJhY3RlcmlzdGljLCByZWFkQSwgYXBwLm9uRXJyb3IpO1xuICAgICAgICBhcHAuc2VuZENtZF9wcm9taXNlKFwiQVwiKVxuICAgICAgICAgICAgLmNhdGNoKGFwcC5vbkVycm9yKTtcbiAgICB9LFxuXG4gICAgb25SZWFkQmF0dGVyeUxldmVsOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBtZXNzYWdlO1xuICAgICAgICB2YXIgYSA9IG5ldyBVaW50OEFycmF5KGRhdGEpO1xuICAgICAgICBhcHAuYmF0dGVyeSA9IGFbMF1cbiAgICAgICAgYXBwLmxvZyhhLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgICAgIGFwcC5sb2coJ2JhdHRlcnk6ICcrYXBwLmJhdHRlcnkpO1xuICAgIH0sXG4gICAgb25SZWFkQ291bnQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGEgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgICAgICAgYXBwLnN0YXR1cyA9IGFbM107XG4gICAgICAgIHZhciBhID0gbmV3IFVpbnQxNkFycmF5KGRhdGEpO1xuICAgICAgICBhcHAubG9nKGEudG9TdHJpbmcoKSk7XG4gICAgICAgIGFwcC5jb3VudHMgPSBhWzBdO1xuICAgICAgICBhcHAubG9nKCdjb3VudHM6ICcrYVswXSk7XG4gICAgfSxcbiAgICBkaXNjb25uZWN0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb25FcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBhcHAub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICBhcHAuc2hvd01haW5QYWdlKCk7XG4gICAgICAgICAgICBhcHAucmVmcmVzaERldmljZUxpc3QoKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGRldmljZUlkID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQuZGV2aWNlSWQ7XG4gICAgICAgIHJlc3VsdERpdi5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICAvLyBibGUuZGlzY29ubmVjdChhcHAuZGV2aWNlSWQsIGFwcC5zaG93TWFpblBhZ2UsIGFwcC5vbkVycm9yKTtcbiAgICAgICAgYmxlLmRpc2Nvbm5lY3QoYXBwLmRldmljZUlkLCBhcHAuc2hvd01haW5QYWdlLCBvbkVycm9yKTtcbiAgICB9LFxuICAgIHNob3dNYWluUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIG1haW5QYWdlLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICBkZXRhaWxQYWdlLmhpZGRlbiA9IHRydWU7XG4gICAgfSxcbiAgICBzaG93RGV0YWlsUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIG1haW5QYWdlLmhpZGRlbiA9IHRydWU7XG4gICAgICAgIGRldGFpbFBhZ2UuaGlkZGVuID0gZmFsc2U7XG4gICAgfSxcbiAgICBvbkVycm9yOiBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgYWxlcnQoXCJFUlJPUjogXCIgKyByZWFzb24pOyAvLyByZWFsIGFwcHMgc2hvdWxkIHVzZSBub3RpZmljYXRpb24uYWxlcnRcbiAgICB9XG59O1xuXG5hcHAuaW5pdGlhbGl6ZSgpOyJdLCJzb3VyY2VSb290IjoiIn0=