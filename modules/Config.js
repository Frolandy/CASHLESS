//local vars
var _readerType = {
	nfc: 0,
	em_marine: 1
};

var _Memory = null;
var _deviceConfigSerial = null;
var _deviceConfigMsg = "";


var config = function (Memory, deviceConfigSerial){

	_Memory = Memory;
	_deviceConfigSerial = deviceConfigSerial;

	this.operation_mode = null;
	this.sales_mode = null;
	this.reader_type = null;
	this.limit = null;
	this.ip = null;
	this.mac = null;
	this.gateway = null;
	this.subnet = null;
	this.dns = null;
	this.host = null;
	this.total_pages = null;
	this.last_page_length = null;
	this.interval = null;
	this.table_of_content = null;
	this.keySize = null;

};


config.prototype.setNewLimit = function(price){

	if(this.limit - price >= 0){
        this.limit -= price;
    }

};


config.prototype.getSettings = function(string){

	switch(string){

		case "operation":
			return this.operation_mode;

		case "sales":
			return this.sales_mode;

		case "reader":
			return this.reader_type;

		case "limit":
			return this.limit;

		case "internet":
			var settingsArray = {
				ip: this.ip, 
				mac: this.mac, 
				gateway: this.gateway, 
				subnet: this.subnet, 
				dns: this.dns
			};
			return settingsArray;

	}

};

config.prototype.getContent = function(string){

	switch(string){

		case "total":
			return this.total_pages;

		case "length":
			return this.last_page_length;

		case "interval":
			return this.interval;

		case "table":
			return this.table_of_content;

		case "size":
			return this.keySize;


	}

};


config.prototype.getKeys = function(page){

	if(page !== this.total_pages){
		return _Memory.getKeys(Math.ceil(page + (this.table_of_content.length / this.keySize) / _Memory.getDatabaseSize()), _Memory.getDatabaseSize());
	}
	else
		return _Memory.getKeys(Math.ceil(page + (this.table_of_content.length / this.keySize) / _Memory.getDatabaseSize()), this.last_page_length * this.keySize);

};


config.prototype.setConfig = function(){

	this.operation_mode = _Memory.readSettings("operating");
	this.sales_mode = _Memory.readSettings("sales");
	this.reader_type = _Memory.readSettings("reader");

	switch(this.reader_type){
		case _readerType.nfc: 
			_Memory.keySize = 4;
		break;

		case _readerType.em_marine:
			_Memory.keySize = 8;
		break;

		default: 
			print("error reader type");
	}


	this.ip = _Memory.readSettings("ip");
	this.mac = _Memory.readSettings("mac");
	this.gateway = _Memory.readSettings("gateway");
	this.subnet = _Memory.readSettings("subnet");
	this.dns = _Memory.readSettings("dns");
	this.host = _Memory.readSettings("host");
	this.total_pages = _Memory.readSettings("total");
	this.last_page_length = _Memory.readSettings("length");
	this.interval = _Memory.readSettings("interval");
	this.table_of_content = _Memory.readSettings("table");
	this.keySize = _Memory.readSettings("size");
	this.limit = "";

	var sumArray = _Memory.readSettings("limit");

	for(var i in sumArray){

		if(String.fromCharCode(parseInt(sumArray[i])) === '-') break;
		else this.limit += String.fromCharCode(parseInt(sumArray[i]));

	}

	this.limit = parseInt(this.limit);

};


config.prototype.startDeviceConfigListen = function(){

	print("Device config listen ready.....");
	var owner = this;

	_deviceConfigSerial.on("data", function(data){


		if(data.indexOf('\n') >= 0){

        	if(_deviceConfigMsg === "END"){
        		print("Conig received");
          		owner.setConfig();
          		_deviceConfigMsg = "";
        	}else{
           		_Memory.save(_deviceConfigMsg);
           		_deviceConfigMsg = "";
           		_deviceConfigSerial.print("OK\n");
        	}

      	}
      	else _deviceConfigMsg += data;

	});
};


exports.connect = function(Memory, deviceConfigSerial) {

	return new config(Memory, deviceConfigSerial);

};