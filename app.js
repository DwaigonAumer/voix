const fs = require('fs');
const path = require('path');
const fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const ws = require('ws');

const vm = require('./build/Release/vm.node');
const config = require('./config.json');
const binds = fs.readFileSync('binds.txt').toString().split('\n');

const stripAmount = 12;

// Voiceemeter

vm.load(config.dll);
vm.login();

if (vm.getType() !== 3) {
	vm.logout();
	console.error('Voicemeeter Potato is not running!');
	process.exit(1);
}

// HTTP

const app = fastify();

app.register(fastifyStatic, {
	root: path.resolve('public/')
});

app.listen(config.port, config.host, (err) => {
	if (err) throw err;
});

// WS

const wss = new ws.Server({ port: config.port + 1 });
const state = { levels: new Array(30).fill(0) };
let lastState = {};

setInterval(() => {
	const levels = new Array(30).fill(0);
	for (let i = 0; i < stripAmount; i++) levels[i] = vm.getLevel(1, i);

	// Voicemeeter AUX
	levels[12] = vm.getLevel(1, 18);
	levels[13] = vm.getLevel(1, 19);

	// VAIO 3
	levels[14] = vm.getLevel(1, 26);
	levels[15] = vm.getLevel(1, 27);

	// A1
	levels[16] = vm.getLevel(3, 0);
	levels[17] = vm.getLevel(3, 1);

	// A2
	levels[18] = vm.getLevel(3, 8);
	levels[19] = vm.getLevel(3, 9);

	// A3
	levels[20] = vm.getLevel(3, 16);
	levels[21] = vm.getLevel(3, 17);

	// A4
	levels[22] = vm.getLevel(3, 24);
	levels[23] = vm.getLevel(3, 25);

	// A5
	levels[24] = vm.getLevel(3, 32);
	levels[25] = vm.getLevel(3, 33);
	
	// B1
	levels[26] = vm.getLevel(3, 41);
	levels[27] = vm.getLevel(3, 42);

	// B2
	levels[28] = vm.getLevel(3, 49);
	levels[29] = vm.getLevel(3, 50);

	// B3
	levels[30] = vm.getLevel(3, 57);
	levels[31] = vm.getLevel(3, 58);
	
	for (const i in levels) state.levels[i] += levels[i] > state.levels[i] && levels[i] > 0 ? levels[i] - state.levels[i] : -.056;
	if (vm.isDirty()) for (const bind of binds.slice(0, -1)) state[bind] = vm.getFloat(bind);
	
	const changes = { levels: state.levels };
	for (const key in state) if (state[key] !== lastState[key]) changes[key] = state[key];
	lastState = { ...state };
	
	for (const client of wss.clients) if (client.readyState === ws.OPEN) client.send(JSON.stringify(changes));
}, 5);

wss.on('connection', (socket) => {
	socket.send(JSON.stringify(state));
	
	socket.on('message', (msg) => {
		const data = JSON.parse(msg);
		vm.setFloat(data[0], data[1]);
	});
});
