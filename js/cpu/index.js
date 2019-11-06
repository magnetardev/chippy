import instructions from './instructions.js';
import fontSet from './fontset.js';

export default class CPU {
	constructor(main) {
		this.main = main;
		this.reset();
	}

	reset() {
		// Registries
		this.V = [];

		// Set all registries as 0
		for (let i = 0; i < 16; i++) {
			this.V[i] = 0;
		}

		// Reset index register
		this.I = 0;

		// Program counter starts at 0x200
		this.pc = 0x200;
		
		// Memory
		this.memory = [];
		
		// Set all memory values as 0
		for (let i = 0; i < 4096; i++) {
			this.memory[i] = 0;
		}

		// Controls
		this.controls = [];

		// Set all controls as inactive
		for (let i = 0; i < 16; i++) {
			this.controls[i] = 0;
		}

		// Set timers
		this.nextClock = null;
		this.delayTimer = 0;
		this.soundTimer = 0;

		// Setup Jump Stack
		this.jumpStack = [];

		// Font Set
		this.fontSet = fontSet;

		// Load into memory
		for (let i = 0; i < this.fontSet.length; i++) {
			this.memory[i] = this.fontSet[i];
		}

		// Instructions
		this.instructions = instructions;
		
		// Setup Audio
		this.setupAudio()

		// Create AudioContext onclick/touchstart.
		document.body.addEventListener('click', () => this.setupAudio());
		document.body.addEventListener('touchstart', () => this.setupAudio());
	}

	clock() {
		
		// Manage Timers
		if (this.delayTimer > 0) {
			this.delayTimer--;
		};
		if (this.soundTimer > 0) {
			this.soundTimer--;
		};
		
		// Play Audio
		if (this.soundTimer != 0) {
			let t = this.audioContext.currentTime;
			this.gainNode.gain.setValueAtTime(1, t);
			this.gainNode.gain.setValueAtTime(0, t + 0.1);
		}
		// Frame
		for (let i = 0; i < 250 / 60 | 0; i++) {
			let opcode = this.getOpcode();
			let id = this.getInstruction(opcode);
			this.handleInstruction(id, opcode);
		}

		this.nextClock = setTimeout(this.clock.bind(this), 16);
	};

	start() {
		this.pc = 0x200;
		this.clock();
	}

	stop() {
		if (!!this.nextClock) {
			clearTimeout(this.nextClock);
		}
	}

	fill(data) {
		this.pc = 0x200;
		for (let i in data) {
			this.memory[this.pc] = data[i];
			this.pc++;
		}
		this.pc = 0x200;
	}

	getOpcode() {
		let op = (this.memory[this.pc] << 8) + this.memory[this.pc + 1];
		if (isNaN(op)) {
			throw Error('Error; PC:', this.pc);
		}
		return op;
	};

	getInstruction(opcode) {
		for (let i in this.instructions.masks) {
			if ((this.instructions.masks[i] & opcode) == this.instructions.ids[i]) {
				return i | 0;
			}
		}
	}

	handleInstruction(identifier, opcode) {
		let bytes = [opcode & 0x00F, (opcode & 0x0F0) >> 4, (opcode & 0xF00) >> 8];
		let NN = (bytes[1] << 4) + bytes[0];
		// console.log(identifier);
		switch (identifier) {
			case 0: // 0NNN
				// Calls RCA 1802 program at address NNN. Not necessary for most ROMs.
				console.log("Calling RCA 1802 not supported.");
				break;
			case 1: // 00E0
				// Clears the screen.
				this.main.screen.reset();
				break;
			case 2: // 00EE
				// Returns from a subroutine.
				this.pc = this.jumpStack.pop();
				break;
			case 3: // 1NNN
				// Jumps to address NNN.
				this.pc = (bytes[2] << 8) + NN;
				this.pc -= 2;
				break;
			case 4: // 2NNN
				// Calls subroutine at NNN.
				if (this.jumpStack.length < 16) {
					this.jumpStack.push(this.pc);
					this.pc = ((bytes[2] << 8) + (bytes[1] << 4) + bytes[0]) - 2;
				} else {
					throw Error("Jump stack overflow");
				}
				break;
			case 5: // 3XNN
				// Skips the next instruction if VX equals NN. (Usually the next instruction is a jump to skip a code block)
				if (this.V[bytes[2]] == (bytes[1] << 4) + bytes[0]) {
					this.pc += 2;
				}
				break;
			case 6: // 4XNN
				// Skips the next instruction if VX doesn't equal NN. (Usually the next instruction is a jump to skip a code block)
				if (this.V[bytes[2]] != ((bytes[1] << 4) + bytes[0])) {
					this.pc += 2;
				}

				break;
			case 7: // 5XY0
				// Skips the next instruction if VX equals VY. (Usually the next instruction is a jump to skip a code block)
				if (this.V[bytes[2]] == this.V[bytes[1]]) {
					this.pc += 2;
				}
				break;
			case 8: // 6XNN
				// Sets VX to NN.
				this.V[bytes[2]] = NN;
				break;
			case 9: // 7XNN
				// Adds NN to VX. (Carry flag is not changed)
				this.V[bytes[2]] += NN;
				this.V[bytes[2]] &= 0xFF;
				break;
			case 10: // 8XY0
				// Sets VX to the value of VY.
				this.V[bytes[2]] = this.V[bytes[1]];
				break;
			case 11: // 8XY1
				// Sets VX to VX or VY. (Bitwise OR operation)
				this.V[bytes[2]] |= this.V[bytes[1]];
				break;
			case 12: // 8XY2
				// Sets VX to VX and VY. (Bitwise AND operation)
				this.V[bytes[2]] &= this.V[bytes[1]];
				break;
			case 13: // 8XY3
				// Sets VX to VX xor VY.
				this.V[bytes[2]] ^= this.V[bytes[1]];
				break;
			case 14: // 8XY4
				// Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
				this.V[bytes[2]] += this.V[bytes[1]];
				if ((this.V[bytes[2]] / 0x100) >= 1) {
					this.V[bytes[2]] &= 0xFF;
					this.V[0xF] = 1;
				} else {
					this.V[0xF] = 0;
				}
				break;
			case 15: // 8XY5
				// VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
				this.V[bytes[2]] -= this.V[bytes[1]];
				if (this.V[bytes[2]] < 0) {
					this.V[0xF] = 0;
				} else {
					this.V[0xF] = 1;
				}
				break;
			case 16: // 8XY6
				// Stores the least significant bit of VX in VF and then shifts VX to the right by 1.[2]
				this.V[0xF] = this.V[bytes[2]] & 0x01;
				this.V[bytes[2]] = this.V[bytes[2]] >> 1;
				break;
			case 17: // 8XY7
				// Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
				this.V[bytes[2]] -= this.V[bytes[1]];
				if (this.V[bytes[2]] < 0) {
					this.V[bytes[2]] += 0x100;
					this.V[0xF] = 0;
				} else {
					this.V[0xF] = 1;
				}
				break;
			case 18: // 8XYE
				// Stores the most significant bit of VX in VF and then shifts VX to the left by 1.[3]
				this.V[0xF] = this.V[bytes[2]] >> 7;
				this.V[bytes[2]] = (this.V[bytes[2]] << 1) & 0xFF
				break;
			case 19: // 9XY0
				// Skips the next instruction if VX doesn't equal VY. (Usually the next instruction is a jump to skip a code block)
				if (this.V[bytes[2]] != this.V[bytes[1]]) {
					this.pc += 2;
				}
				break;
			case 20: // ANNN
				// Sets I to the address NNN.
				this.I = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0];
				break;
			case 21: // BNNN
				// Jumps to the address NNN plus V0.
				this.pc = (bytes[2] << 8) + (bytes[1] << 4) + bytes[0] + this.V[0];
				break;
			case 22: // CXNN
				// Sets VX to the result of a bitwise and operation on a random number (Typically: 0 to 255) and NN.
				this.V[bytes[2]] = Math.floor(Math.random() * ((bytes[1] << 4) + bytes[0]));
				break;
			case 23: // DXYN
				// Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded starting from memory location I; I value doesn’t change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn’t happen
				let x = this.V[bytes[2]],
					y = this.V[bytes[1]];
				let flag = false,
					flip = false;
				for (let i = 0; i < bytes[0]; i++) {
					let line = this.memory[this.I + i];
					for (let j = 0; j < 8; j++) {
						if (((line >> (7 - j)) & 1) == 1) {
							let pixelX = (x + j) & 0x3F;
							let pixelY = (y + i) & 0x1F;
							flip = this.main.screen.render(pixelX, (y + i));
							if (flip) {
								flag = true;
							}
						}

					}
				}
				this.V[0xF] = flag ? 1 : 0;
				break;
			case 24: // EX9E
				// Skips the next instruction if the key stored in VX is pressed. (Usually the next instruction is a jump to skip a code block)
				if (this.controls[this.V[bytes[2]]] == 1) {
					this.pc += 2
				}
				break;
			case 25: // EXA1
				// Skips the next instruction if the key stored in VX isn't pressed. (Usually the next instruction is a jump to skip a code block)
				if (this.controls[this.V[bytes[2]]] == 0) {
					this.pc += 2
				}
				break;
			case 26: // FX07
				// Sets VX to the value of the delay timer.
				this.V[bytes[2]] = this.delayTimer;
				break;
			case 27: // FX0A
				// A key press is awaited, and then stored in VX. (Blocking Operation. All instruction halted until next key event)
				for (let control = 0; control < this.controls; control++) {
					if (this.controls[control] == 1) {
						this.V[bytes[2]] = control;
						this.pc += 2;
					}
				}
				break;
			case 28: // FX15
				// Sets the delay timer to VX.
				this.delayTimer = this.V[bytes[2]];
				break;
			case 29: // FX18
				// Sets the sound timer to VX.
				this.soundTimer = this.V[bytes[2]];
				break;
			case 30: // FX1E
				// Adds VX to I.[4]
				this.V[0xF] = 0;
				this.I += this.V[bytes[2]];
				if (this.I > 0xFFF) {
					this.V[0xF] = 1;
				}
				this.I &= 0xFFF;
				break;
			case 31: // FX29
				// Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
				this.I = this.V[bytes[2]] * 5;
				break;
			case 32: // FX33
				// Stores the binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. (In other words, take the decimal representation of VX, place the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.)
				this.memory[this.I] = (this.V[bytes[2]] / 100) | 0;
				this.memory[this.I + 1] = (this.V[bytes[2]] % 100) / 10 | 0;
				this.memory[this.I + 2] = (this.V[bytes[2]] % 10);
				break;
			case 33: // FX55
				// Stores V0 to VX (including VX) in memory starting at address I. The offset from I is increased by 1 for each value written, but I itself is left unmodified.
				for (let i = 0; i <= bytes[2]; i++) {
					this.memory[this.I + i] = this.V[i];
				}
				break;
			case 34: // FX65
				// Fills V0 to VX (including VX) with values from memory starting at address I. The offset from I is increased by 1 for each value written, but I itself is left unmodified.
				for (let i = 0; i <= bytes[2]; i++) {
					this.V[i] = this.memory[this.I + i];
				}
				break;
			default:
				throw Error('Unknown instruction');
		}
		// Preform next instruction
		this.pc += 2;
	}

	setupAudio() {
		console.log("Hello?")
		console.log(this);
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		this.audioContext = new AudioContext();
		this.oscillator = this.audioContext.createOscillator();
		this.gainNode = this.audioContext.createGain();
		this.oscillator.type = "sine";
		this.oscillator.frequency.value = 440;
		this.oscillator.connect(this.gainNode);
		this.oscillator.start();
		this.gainNode.connect(this.audioContext.destination);
		this.gainNode.gain.value = 0;
		document.body.removeEventListener('click', this.setupAudio);
		document.body.removeEventListener('touchstart', this.setupAudio);
	}

}