'use strict';

var raw;
var data = [];
var iqr_threshold = 100;

function CreateTableFromJSON(data) {
    var col = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    } // CREATE DYNAMIC TABLE. 
    var table = document.createElement("table");
    var caption = document.createElement("caption");
    caption.innerHTML = "Recent Encounters";
    table.appendChild(caption);
    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
    var thead = document.createElement("thead");
    var tr = thead.insertRow(-1);
    // TABLE ROW. 
    for (var i = 0; i < col.length; i++) {
        var th = document.createElement("th");
        // TABLE HEADER. 
        th.innerHTML = `<div label="${col[i]}"> </div>`;
        tr.appendChild(th);
    }
    th = document.createElement("th")
    th.innerHTML = '<th class="scrollbarhead"></th>';
    tr.appendChild(th);

    table.appendChild(thead);
    var tbody = document.createElement("tbody");

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < data.length; i++) {
        tr = tbody.insertRow(-1);
        for (var j = 0; j < col.length; j++) {
            var tabCell = tr.insertCell(-1);
            tabCell.innerHTML = data[i][col[j]];
        }
        if (parseFloat((data[i]['sound'])) < 2) {
            tr.style.backgroundColor = "salmon";
        }
    }
    table.appendChild(tbody);

    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
}

function raw2array(raw) {
    app.log("raw2array");
    let data = [];
    let dv = new DataView(raw)
    app.log("created dataview");
    app.log("raw length: "+ raw.byteLength);
    for (let offset = 0; offset < raw.byteLength; offset += 32) {
        // app.log("offset: "+offset);
        let t = dv.getUint32(offset, true);
        // app.log(" t: "+t);
        if (t > 0) {
            /* Check if mark, unmark, etc... */
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
                console.log("found tag");
            }
        }
        // check if first 4 bytes> 0,it is a timestamp
        if (t > 0) {
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
            // row.raw_sound=sound; 
            let rssi = new Int8Array(raw.slice(offset + 12 + 8, offset + 32))
            row.rssi = (
                rssi.reduce((acc, data) => acc + data, 0) /
                rssi.reduce((acc, data) => (data != 0) ? acc + 1 : acc, 0)).toFixed(1)
            data.push(row)
            offset += 32; // skip encouunter_id
        }
    }
    app.log("data "+data.length)
    return data;
}

