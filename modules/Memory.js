//local vars
var _database = null;
var _settings = null;

var _settingsPageSize = null;
var _databasePageSize = null;

var _address = {
	pages: 		0,
	operating: 	0,
	length: 	1,
	sales: 		1,
	interval: 	2,
	reader: 	2,
	limit: 		3,
	table: 		0,
	keys:  		0,
	ip: 		1,
	mac: 		5,
	gateway: 	11,
	subnet: 	15,
	dns: 		19,
	host:       23 
};

var _length = {
	settings:   1,
	limit: 		30,
	ip: 		 4, 
	internet: 	 6
} 

var memory = function(settings, settingsPageSize, database, databasePageSize){

	_settings = settings;
	_database = database;
	_settingsPageSize = settingsPageSize;
	_databasePageSize = databasePageSize;

	_address.table += _databasePageSize;
	_address.keys += _databasePageSize;
	_address.ip += _databasePageSize;
	_address.mac += _databasePageSize;
	_address.gateway += _databasePageSize;
	_address.subnet += _databasePageSize;
	_address.dns += _databasePageSize;

	this.keySize = null;

};


memory.prototype.save = function(msg){

	var JsonMsg = JSON.parse(msg);
	var type = JsonMsg.typeOf;

	if(JsonMsg.msg_type){

    	var page_number = JsonMsg.page_number;

    	switch(type){

    		case "title":
    			_database.write(_address.pages,  JsonMsg.pages);
      			_database.write(_address.length, JsonMsg.last_page_length);
      			_database.write(_address.interval, JsonMsg.interval);
      			this.keySize = JsonMsg.interval.length / 2;
      		break;

      		case "table":
      			_database.write(page_number * _address.table, JsonMsg.table_of_content);
      		break;

      		case "keys":
      			_database.write(page_number * _address.keys, JsonMsg.keys);
      		break;

    	}
      		
  	}else{

  		switch(type){

  			case "operating":
  				_settings.write(_address.operating, JsonMsg.operating_mode);
      			_settings.write(_address.sales, JsonMsg.sales_mode);
      			_settings.write(_address.reader, JsonMsg.readerType);

      			var sum = JsonMsg.limit.split('\0').join("");

      			for(var i in sum)
        			_settings.write(_address.limit + i, sum[i]);
      		
				_settings.write(sum.length + _address.limit, '-');
			break;

			case "internet":
				for(var i = 0; i<4; i++){
        			_settings.write(_address.ip 	 +  i, parseInt(JsonMsg.ip.split('.')[i]));
        			_settings.write(_address.host	 +	i, parseInt(JsonMsg.host.split('.')[i]));
        		}
        		for(var i = 0; i < 6; i++){
        			_settings.write(_address.mac 	 +  i, parseInt(JsonMsg.mac.split('.')[i]));
        			_settings.write(_address.gateway +  i, parseInt(JsonMsg.gateway.split('.')[i]));
        			_settings.write(_address.subnet  + 	i, parseInt(JsonMsg.subnet.split('.')[i]));
        			_settings.write(_address.dns 	 + 	i, parseInt(JsonMsg.dns.split('.')[i]));
      			}
      		break;
  		}

  	}

};


memory.prototype.readSettings = function(string){

	switch(string){

		case "total":
			return parseInt(_database.read(_address.pages, _length.settings));

		case "length":
			return parseInt(_database.read(_address.length, _length.settings));

		case "interval":
			return _database.read(_address.interval, this.keySize * 2);

		case "table":
			return	_database.read(_databasePageSize, parseInt(_database.read(_address.pages, 1)) * this.keySize);

		case "operating":
			return parseInt(_settings.read(_address.operating, _length.settings));

		case "sales":
			return parseInt(_settings.read(_address.sales, _length.settings));

		case "reader":
			return parseInt(_settings.read(_address.reader, _length.settings));

		case "limit":
			return _settings.read(_address.limit, _length.limit);

		case "size":
			return this.keySize;

		case "ip":
			return _settings.read(_address.ip, _length.ip).join('.');

		case "mac":
			return _settings.read(_address.mac, _length.internet).join('.');

		case "gateway":
			return _settings.read(_address.gateway, _length.internet).join('.');

		case "subnet":
			return _settings.read(_address.subnet, _length.internet).join('.');

		case "dns":
			return _settings.read(_address.dns, _length.internet).join('.');

		case "host":
			return _settings.read(_address.host, _length.ip).join('.');

	}

};


memory.prototype.getKeys = function(page, range){

	return _database.read(page * _databasePageSize, range);

};


memory.prototype.getDatabaseSize = function(){

	return _databasePageSize;

};


exports.setup = function(settings, settingsPageSize, database, databasePageSize){

	return new memory(settings, settingsPageSize, database, databasePageSize);

};