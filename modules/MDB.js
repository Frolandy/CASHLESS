//local vars
var _MdbSerial = null;
var _MdbMsg = "";
var owner = null;

var MDB = function(MdbSerial){
	_MdbSerial = MdbSerial;
    owner = this;
};

function processMdbCommands(cmd){
	var command = cmd.split(':')[0];
    switch(command){
        case "STARTED":
            print("MDB STARTED");
            break;
        case 'BALANCE':
            print('Balance ACK recieved');
            break;
        case 'ENABLE':
            print('ENABLE recieved');
            owner.emit('data', {answer: 'ENABLE'});
            break;
        case 'DISABLE':
            //disableDevice();
            print('DISABLE received');
            owner.emit('data', {answer: 'DISABLE'});
            break;
        case 'VEND':
            var product_id = cmd.split(':')[1];
            var product_price = parseInt(cmd.split(':')[2],10)/100;

            //print('VEND INFO | PRODUCT ID: ' + product_id + '   PRODUCT PRICE: ' + product_price);
            owner.emit('data', {answer: 'VEND', id: product_id, price: product_price});
            break;
        case 'CANCEL':
            owner.emit('data', {answer: 'CANCEL'});
            print("CANCEL recieved");
            break;
        case "DENIED":
            owner.emit('data', {answer: 'DENIED'});
            print("DENIED");
            break;
        default:
            //unexpected command
            print(cmd);
    }
}

MDB.prototype.startMdbListen = function(){
  
    _MdbSerial.on("data", function(data){
        if(data.indexOf('\n') >= 0){
            processMdbCommands(_MdbMsg);
            _MdbMsg = "";
    	} else {
            _MdbMsg += data;
        }
	});
};

MDB.prototype.sendBalance = function(Balance){
    print("Send Balance"); 
    print(Balance/100);
    _MdbSerial.print("" + Balance + "\n");
};

exports.connect = function(MdbSerial){
	return new MDB(MdbSerial);
};