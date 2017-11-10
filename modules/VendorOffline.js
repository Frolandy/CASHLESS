//local vars
var _config = null;
var _searcher = null;

var VendorOffline = function(config, searcher) {
    _config = config;
    _searcher = searcher;
};

//uid is the Uint8Array with bytes of card number
VendorOffline.prototype.ReadLimit = function(uid) {
    // TODO: read user limit
    // RETURN: no
    // events:
    //  -- 'data' with user limit
    //  -- 'error' with error type & message
    var isValidKey = _searcher.search(uid);
    if(isValidKey) {
        var limit = _config.getSettings("limit");
        this.emit("balance", limit);
    } else {
        this.emit("error", {message: "Key not found"});
    }
};

VendorOffline.prototype.SavePurchase = function(productId, productCost) {
    // TODO: save user purchase
    // RETURN: no
    _config.setNewLimit(productCost);
};

exports.connect = function(config, searcher) {
    return new VendorOffline(config, searcher);
};