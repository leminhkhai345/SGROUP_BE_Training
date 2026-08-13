let array = [1,2,3,4,5];

Array.prototype.forEach2 = function(callback) {
    if(typeof callback === 'function') {
        for(let i = 0; i < this.length; i++) {
            callback(this[i]);
    }
    }
};

array.forEach2((e) => {
    console.log(e);
});