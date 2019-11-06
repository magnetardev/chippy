import CPU from './cpu/index.js';
import Screen from './screen.js';
import Joypad from './joypad.js';

class Chip8 {
	constructor({ canvas }) {
		this.screen = new Screen(canvas);
		this.joypad = new Joypad(this);
		this.cpu = new CPU(this);
		this.rom = null;
	}

	async loadROM(data) {
        try {
			var rom = new Uint8Array(data);
			this.restart();
			this.cpu.reset();
			this.cpu.fill(rom);
			this.cpu.start();
			return Promise.resolve("Loaded ROM")
		} catch (err) {
			return Promise.reject(err);
		}
	}
	restart() {
		this.cpu.stop();
		this.screen.reset();
	};
}

window["Chip8"] = new Chip8({
	canvas: document.querySelector('canvas'),
});

window["Chip8"].screen.resize();


window.onresize = () => {
	window["Chip8"].screen.resize();
}

document.querySelector('input').addEventListener('change', (evt) => {
	var reader = new FileReader();
	reader.onload = function(res) {
		window["Chip8"].loadROM(res.target.result).catch(err => console.error(err));
	}
	reader.readAsArrayBuffer(evt.target.files[0]);
});