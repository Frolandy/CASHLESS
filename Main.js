    var eepromInfo = {
        scl: B8, sda: B9
    };

    var nfcInfo = {
        scl: P12, sda: P11
    };

    var mdbInfo = {
        tx: A0, rx: A1, rst: A10
    };

    var databaseInfo = {
        size: 128, pageSize: 256, address: 4
    };

    var settingsInfo = {
        size: 32, pageSize: 64, address: 0
    };

    var readerType = {
        nfc: 0, EMMarine: 1
    };

    var ethInfo = {
        int: B10, rst: B11, cs: B12, sclk: B13, miso: B14, mosi: B15
    };

    // global variables
    var database;
    var settings;
    var config;
    var memory;
    var binSearch;
    var net;
    var crc;

    var reader = 'undefined';
    var manager = 'undefined';
    var vendingMachine = 'undefined';
    var cardManager = 'undefined';
    var crc = 'undefined';
    var eth = 'undefined';

    var found = false;
    var userId;


    function subscribeToReaderEvents(reader) {

        reader.on("data", function(key){
            if(!found){
                found = true;
                print(key);
                cardManager.ReadLimit(key);
            }
        });

        cardManager.on('balance', function(data){
            if(!config.getSettings("operation")){
                print("send");
                vendingMachine.sendBalance(data * 100);
            }
            else{
                userId = null;
                print("BALANCE: ", data.balance);
                userId = data.userId;
                print("USERID: ", data.userId);
                vendingMachine.sendBalance(data.balance * 100);
            }
        });

        cardManager.on('sell', function(data){
            print("SELL DONDE");
            found = false;
            print(data);
        });

        cardManager.on("error", function(error){
            I2C3.writeTo(0x20,1);setTimeout(function(){
              I2C3.writeTo(0x20,4);
            },1500);
            found = false;
            print(error.message);
        });

    }

    function startReadCards(){
        switch(config.getSettings("reader")){
            case readerType.nfc:
                reader = require("CardReader").setup("nfc", {i2c: I2C3});
                break;
            case readerType.EMMarine:
                reader = require("CardReader").setup("em-marine", {oneWirePin: A7});
                break;
        }
        if(reader != 'undefined') {
            subscribeToReaderEvents(reader);
            reader.StartListening();
        }
    }

    function enableDevice() {
        //TODO: set correct indication
        print("MDB enabled recieved.");
        startReadCards();
        I2C3.writeTo(0x20,4);
    }

    function startMdbListen() {
        vendingMachine.startMdbListen();
        vendingMachine.on('data', function(data){
            switch(data.answer){
                case "ENABLE":
                    enableDevice();
                    break;
                case "VEND":
                    //TODO: extract to CardManager
                    print(data);
                    if(!config.getSettings("operation"))
                        config.setNewLimit(data.price);
                    else
                        cardManager.SavePurchase(data.id, data.price);
                    found = false;
                    break;
                //TODO: log incorrect vending session
                case "DENIED":
                    I2C3.writeTo(0x20,2);setTimeout(function(){
                      I2C3.writeTo(0x20,4);
                    },1500);
                    found = false;
                    break;
                case "CANCEL":
                    found = false;
                    break;
            }
        });
    }

    function initialize() {
        print("Stop MDB procesor...");
        digitalWrite(mdbInfo.rst, false);

        print("Initialize espruino module");
        // setup memory access hardware
      
        I2C3.setup({scl: nfcInfo.scl, sda: nfcInfo.sda});
        I2C3.writeTo(0x20,0);

        I2C1.setup({scl: eepromInfo.scl, sda: eepromInfo.sda});
        database = require("AT24").connect(I2C1, databaseInfo.pageSize, databaseInfo.size, databaseInfo.address);     
        settings = require("AT24").connect(I2C1, settingsInfo.pageSize, settingsInfo.size, settingsInfo.address);
        memory = require("Memory").setup(settings, settingsInfo.pageSize, database, databaseInfo.pageSize);


            // setup device configuration communication line
        Serial2.setup(9600);
        config = require("Config").connect(memory, Serial2);
        config.setConfig();
        binSearch = require("BinarySearch").connect(config);

        if(!config.getSettings("operation"))
            cardManager = require("VendorOffline").connect(config, binSearch);
        else{

            SPI2.setup({ mosi: ethInfo.mosi, miso: ethInfo.miso, sck: ethInfo.sclk });
            eth = require("WIZnet").connect(SPI2, ethInfo.cs);
            eth.setIP(config.ip);
            net = require("net");
            crc = require("CRC16").create();
            cardManager = require("VendorOnline").create(config);
            cardManager.setup(net, config.host, crc, "undefined");
        }


        // setup MDB communication line
        Serial4.setup(9600, {tx: mdbInfo.tx, rx: mdbInfo.rx});
        vendingMachine = require("MDB").connect(Serial4);

        config.startDeviceConfigListen();
        startMdbListen();

        print("Start MDB processor...");
        digitalWrite(mdbInfo.rst, true);
    }

    initialize();  