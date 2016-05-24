class Duration {
	constructor(ms) {
		this.ms = ms;
		this.date = new Date(ms);
	}
	padZero(i){
		return ( i < 10 ? "0" + i : i );
	}
	toHHMMSS() {
		return Math.floor(this.ms/3600000) + ':' + this.padZero(this.date.getMinutes()) + ':' + this.padZero(this.date.getSeconds())
	}

}
