//local vars
var _Config = null;

var Binary = function(Config) {
	_Config = Config;
};


function key_in_range(key, range){

	var keySize = key.length;

  	for(var index = 0; index < keySize; index++){

    	if(parseInt(key[index]) === parseInt(range[index]));
        else if(parseInt(key[index]) > parseInt(range[index])) break;
        else if(parseInt(key[index]) < parseInt(range[index])) return -1;

        if(index === keySize - 1) return 0;

    }

  	for(var index = keySize; index < keySize * 2; index++){

        if(parseInt(key[index - keySize]) === parseInt(range[index]));
        else if(parseInt(key[index - keySize]) < parseInt(range[index])) break;
        else if(parseInt(key[index - keySize]) > parseInt(range[index])) return -1;

        if(index === keySize * 2 - 1) return 0;

    }

  	return 1;
}

function page_search(key, contents){

	var keySize = key.length;
  	var start = 0, end = Math.floor(contents.length / keySize) - 1, position;

    while (start <= end){

        position = Math.floor((start + end) / 2) * keySize;

        for(var index = position; index < position + keySize; index++){

            if(parseInt(key[index - position]) === parseInt(contents[index]));
            else if(parseInt(key[index - position]) < parseInt(contents[index])){

                if(start === end)
                    return Math.floor(position / keySize) + 1;

                end = Math.floor(position / keySize) - 1;
                break;
            }
            else{

                if(start === end)
                    return Math.floor ((position + keySize) / keySize) + 1;

                start = Math.floor(position / keySize) + 1;
                break;
            }

            if(index === position + keySize - 1) return 0;

        }

    }
    return -1;
}

function key_search(key, keys_on_page){

	var keySize = key.length;
   	var begin = 0, end = (keys_on_page.length / keySize), position; 

    while (begin < end){

        position = Math.floor(((begin + end) / 2)) * keySize;

        for(var index = position; index < position + keySize; index++){

            if(parseInt(key[index - position]) === parseInt(keys_on_page[index]));
            else if(parseInt(key[index - position]) < parseInt(keys_on_page[index])){

                end = Math.floor(position/keySize);
                break;

            }
            else{

                begin = Math.floor(position / keySize) + 1;
                break;

            }

           if(index === position + keySize - 1) return 1;

        }

    }
    return 0;
}

Binary.prototype.search = function(key){
	var in_range = key_in_range(key, _Config.getContent("interval"));
  	if (in_range === 0) 
        return 1;
  	if(in_range > 0) {
    	var page = page_search(key, _Config.getContent("table"));
    	if(page === 0) 
            return 1;
        if(page > 0){
        	if(key_search(key, _Config.getKeys(page)))
                return 1;
    	}
 	}
    return 0;
};

exports.connect = function(Config){

	return new Binary(Config);
};