//local vars
var _nfc_poll_interval = 'undefined';
var _nfc = 'undefined';
var _oneWire = 'undefined';
var _owner = null;

var CardReader = function(cardType, params) {
    this._cardType = cardType;
    this._params = params;
    _owner = this;
};

CardReader.prototype._initialize = function() {
  print("_initialize");
    switch(this._cardType) {
        case "nfc":
            _nfc = require("PN532").connect(this._params.i2c);
            break;
        case "em-marine":
            pinMode(this._params.oneWirePin, "input");
            _oneWire = new OneWire(this._params.oneWirePin);
            break;
        default:
            this.emit('error', {message: "Incorrect reader type"});
    }
};

CardReader.prototype._read_nfc_card = function() {
    print("_read_nfc_card");
    var owner = this;
    _nfc.SAMConfig();    
    _nfc_poll_interval = setInterval(function() {
      _nfc.findCards(function(card) {
        print("FIND ", card);
          card = JSON.stringify(card).split(',');
            var key = [card[1],card[2],card[3],card[4]];
            owner.emit('data', key);
      });
    }, 1000);    
};

CardReader.prototype._read_em_marine_card = function() {
    _oneWire.reset();
    _oneWire.write(0x33);
    var result = "";
    for(var i=0; i<7; i++) {
        result += _oneWire.read() + ",";
    }
    result += _oneWire.read();
    var key = result.split(',');
    print("FOUND ", key);
    _owner.emit('data', key);
    setTimeout(function(){
      setWatch(_owner._read_em_marine_card, 
                 _owner._params.oneWirePin, 
                 {repeat: false, edge: "falling"});
    }, 1000);
};

CardReader.prototype.StartListening = function() {
  print("StartListening");
    _owner._initialize();
    switch(_owner._cardType) {
        case "nfc":
            _owner._read_nfc_card();
            break;
        case "em-marine":
            setWatch(_owner._read_em_marine_card, 
                     _owner._params.oneWirePin, 
                     {repeat: false, edge: "falling"});
            break;
    }    
};

CardReader.prototype.StopListening = function() {
    //TODO: stop card listening
};

exports.setup = function(cardType, params) {
  return new CardReader(cardType, params);
};