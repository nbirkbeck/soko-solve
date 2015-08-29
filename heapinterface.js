goog.provide('soko.HeapInterface');



/**
 * @interface
 */
soko.HeapInterface = function() {};

/** @return {number} */
soko.HeapInterface.prototype.size = function() {};

/** @return {boolean} */
soko.HeapInterface.prototype.empty = function() {};

/** 
 * @param {{id:(number|string)}} value
 * @param {number} score
 */
soko.HeapInterface.prototype.push = function(value, score) {};

/** 
 * @return {{value:Object,score:number}} value
 */
soko.HeapInterface.prototype.pop = function() {};

