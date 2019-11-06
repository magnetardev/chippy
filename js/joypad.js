export default class Joypad {
	constructor(main) {
		this.main = main;
		this.controls = [
			96, // 0
			97, // 1
			98, // 2
			99, // 3
			100, // 4
			101, // 5
			102, // 6
			103, // 7
			104, // 8
			105, // 9
			12, // A
			111, // B
			106, // C
			109, // D
			107, // E
			13, // F
		]
		this.bind();
	}
	set(keys) {
		this.controls = controls;
	}
	bind() {
		window.addEventListener('keydown', (evt) => {
			const index = this.controls.indexOf(evt.keyCode);
			if (!(index <= -1)) {
				this.main.cpu.controls[index] = 1;
			}
		});
		window.addEventListener('keyup', (evt) => {
			const index = this.controls.indexOf(evt.keyCode);
			if (!(index <= -1)) {
				this.main.cpu.controls[index] = 0;
			}
		});
	}
}