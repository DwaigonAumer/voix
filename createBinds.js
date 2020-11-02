const fs = require('fs');

const busses = 8;
const stripes = 8;

fs.truncateSync('binds.txt');

const busObject = {
    "Eq.On": null,
    Gain: null,
    Mono: null,
    Mute: null
}

const stripObject = {
    A1: null,
    A2: null,
    A3: null,
    A4: null,
    A5: null,
    B1: null,
    B2: null,
    B3: null,
    Color_x: null,
    Color_y: null,
    Comp: null,
    Fx_x: null,
    Fx_y: null,
    Gain: null,
    Gate: null,
    Mono: null,
    Mute: null,
    Pan_x: null,
    Pan_y: null,
    Solo: null
}

var binds = fs.createWriteStream('binds.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

for (let i = 0; i < busses; i++) {
    Object.keys(busObject).forEach(key => {
        binds.write(`Bus[${i}].${key}\n`)
    });
}

for (let i = 0; i < stripes; i++) {
    Object.keys(stripObject).forEach(key => {
        binds.write(`Strip[${i}].${key}\n`)
    });
}

binds.close();
