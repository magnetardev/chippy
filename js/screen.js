export default class Screen {
	constructor(canvas) {
		this.data = [];
		// Canvas
		this.canvas = canvas;

		this.width = 0;
		this.height = 0;
		this.pixel = 8;

		this.resize();
		this.context = canvas.getContext('2d');

		// this.canvas.height = 32 * this.pixel;
		// this.canvas.width = 64 * this.pixel;


		// Rendering
		this.black = "#000000";
		this.white = "#FFFFFF";
		// Setup
		this.reset();
	}

	reset() {
		this.context.fillStyle = this.black;
		this.context.fillRect(0, 0, this.width, this.height);
		this.data = [];

		for (let x = 0; x < 64; x++) {
			this.data[x] = [];
			for (let y = 0; y < 32; y++) {
				this.data[x][y] = 0;
			}
		}
	}

	render(x, y) {
		this.data[x][y] += 1;
		this.data[x][y] %= 2;

		let flip = false;

		if (this.data[x][y] == 0) {
			this.context.fillStyle = this.black;
			flip = true;
		} else {
			this.context.fillStyle = this.white;
		}
		this.context.fillRect(x * Math.floor(this.pixel), y * Math.floor(this.pixel), Math.floor(this.pixel), Math.floor(this.pixel));
		return flip;
	}

	resize() {
		var container = document.querySelector('.container');
		var containerHeight = container.clientHeight || container.offsetHeight || 0;
		var containerWidth = container.clientWidth || container.offsetWidth || 0;
		if (containerHeight > 0 && containerWidth > 0) {
			var canvas = this.canvas;
			var maxWidth = Math.floor(containerHeight * 2);
			var maxHeight = Math.floor(containerWidth / 2);
			var height = Math.min(maxHeight, containerHeight);
			var width = Math.min(maxWidth, containerWidth);
			canvas.style.width = width + "px";
			this.pixel = ((width*16) / (height*16)) * 2;
			this.width = width;
			this.height = height;
			canvas.style.height = height + "px";
		}
	}
}