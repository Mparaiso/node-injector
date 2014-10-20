/*jslint eqeq:true,node:true,white:true,plusplus:true,nomen:true,unparam:true,devel:true,regexp:true */
/*Copyright © 2014 mparaiso <mparaiso@online.fr>. All Rights Reserved.*/
/* a dependency injection container for javascript */
"use strict";


/**
 * a dependency injection container
 * @constructor
 */
function Injector() {
    this._registry = [];
}

/**
 * register a new service.The service is a singleton
 * @param {String} name
 * @param {Array|Function} array
 * @returns {Injector}
 */
Injector.prototype.service = function (name, array) {
    if (array instanceof Function) {
        var a = [];
        if (!array.inject || !(array.inject instanceof Array)) {
            array.inject = this.getFunctionArgNames(array);
        }
        array = a.concat(array.inject).concat(array);
    }
    this._register(name, array, false);
    return this;
};
/**
 * add a value (object) to the registery
 * @param {String} name
 * @param {*} value
 * @returns {Injector}
 */
Injector.prototype.value = function (name, value) {
    this._register(name, undefined, value);
    return this;
};

/**
 * get an service from the registery,dependencies will be resolved
 * @param {String} name
 * @returns {*} a resolved service
 */
Injector.prototype.get = Injector.prototype.inject = function (name) {
    var service, serviceDefinition, _constructor, _arguments;
    service = this._registry.filter(function (service) {
        return name === service.name;
    })[0];
    if (!service) {
        return;
    }
    if (service.resolved) {
        return service.resolved;
    }
    serviceDefinition = service.service.slice();
    _constructor = serviceDefinition.pop();
    _arguments = serviceDefinition.map(function (service) {
        var s = this.get(service);
        if (s === undefined) {
            throw ["Service", service, 'not found in', name].join(' ');
        }
        return s;
    }, this);

    service.resolved = new (Function.bind.apply(_constructor, [_constructor].concat(_arguments)))();
    return service.resolved;
};
/**
 *
 * @param {String} name
 * @param service
 * @param {*|Boolean} resolved
 * @private
 */
Injector.prototype._register = function (name, service, resolved) {

    this._registry.push({
        name: name,
        service: service,
        resolved: resolved
    });
};
/**
 * clone an injector
 */
Injector.prototype.clone = function () {
    var _injector = new Injector();
    _injector._registry = this._registry.slice();
    return _injector;
};

/** extrat args from function */
Injector.prototype.getFunctionArgNames = function (func) {
    var length, comments, stripped, brackets, keep;
    length = func.length;
    if (length === 0) {
        return [];
    }
    comments = /(\/\*).*?\*\/ /gm;
    stripped = func.toString().replace(comments, "");
    brackets = /(?:\()(.*)?(?:\))/im;
    keep = stripped.match(brackets);
    return keep[1].split(/\s*,\s*/).map(function (service) {
        return service.trim();
    });
};
/**
 * get an array of resolved service values given a function with arguments
 * @param {Function} func
 * @returns {Array}
 */
Injector.prototype.getFunctionArgValues = function (func) {
    return this.getFunctionArgNames(func).map(function (arg) {
        return this.get(arg);
    }, this);
};

function InjectorError() {
    Error.apply(this, [].slice.call(arguments));
}
InjectorError.prototype = Object.create(Error.prototype);

Injector.InjectorError = InjectorError;

Injector.BLACKLIST = [/^clone$/, /^get$/, /^set$/, /^service$/, /^value$/, /^\$/];


module.exports = Injector;
