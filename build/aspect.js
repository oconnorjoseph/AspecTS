"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Target;
(function (Target) {
    Target[Target["InstanceMethods"] = 1] = "InstanceMethods";
    Target[Target["InstanceAccessors"] = 2] = "InstanceAccessors";
    Target[Target["StaticMethods"] = 4] = "StaticMethods";
    Target[Target["StaticAccessors"] = 8] = "StaticAccessors";
})(Target = exports.Target || (exports.Target = {}));
class BoundaryAspect {
    overload(func) {
        let onEntry = this.onEntry.bind(this);
        let onExit = this.onExit.bind(this);
        return function (...args) {
            let passThroughArgs = onEntry(...args);
            let returnValue = func.apply(this, passThroughArgs);
            let passThroughReturnValue = onExit(returnValue);
            return passThroughReturnValue;
        };
    }
}
exports.BoundaryAspect = BoundaryAspect;
class ErrorAspect {
    overload(func) {
        let onError = this.onError.bind(this);
        return function (...args) {
            try {
                return func.apply(this, args);
            }
            catch (e) {
                onError(e);
            }
        };
    }
}
exports.ErrorAspect = ErrorAspect;
class SurroundAspect {
    overload(func) {
        let onInvoke = this.onInvoke.bind(this);
        return function (...args) {
            return onInvoke(func).apply(this, args);
        };
    }
}
exports.SurroundAspect = SurroundAspect;
function aspect(aspectObject, targetFlags = Target.InstanceAccessors | Target.InstanceMethods | Target.StaticMethods | Target.StaticAccessors) {
    return function (...args) {
        if (args.length === 1) {
            classAspect.call(this, ...args, aspectObject, targetFlags);
        }
        else if (args.length === 2) {
            throw Error("Cannot use aspect on properties.");
        }
        else if (args.length === 3) {
            if (args[2] === "number") {
                throw Error("Cannot use aspect on parameters.");
            }
            functionAspect.call(this, ...args, aspectObject);
        }
        else {
            throw Error("Cannot use aspect here.");
        }
    };
}
exports.aspect = aspect;
function classAspect(target, aspectObject, targetFlags) {
    let instanceDescriptors = getDescriptors(target.prototype, aspectObject);
    let staticDescriptors = getDescriptors(target, aspectObject);
    instanceDescriptors.forEach(({ key, descriptor }) => {
        if ((targetFlags & Target.InstanceAccessors) && (descriptor.get || descriptor.set)) {
            decorateAccessor(target.prototype, key, descriptor, aspectObject);
        }
        if ((targetFlags & Target.InstanceMethods) && typeof descriptor.value == "function") {
            decorateProperty(target.prototype, key, descriptor, aspectObject);
        }
    });
    staticDescriptors.forEach(({ key, descriptor }) => {
        if ((targetFlags & Target.StaticAccessors) && (descriptor.get || descriptor.set)) {
            decorateAccessor(target, key, descriptor, aspectObject);
        }
        if ((targetFlags & Target.StaticMethods) && typeof descriptor.value == "function") {
            decorateProperty(target, key, descriptor, aspectObject);
        }
    });
}
function decorateAccessor(target, key, descriptor, aspectObject) {
    Object.defineProperty(target, key, {
        get: descriptor.get ? aspectObject.overload(descriptor.get) : undefined,
        set: descriptor.set ? aspectObject.overload(descriptor.set) : undefined,
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
    });
}
function decorateProperty(target, key, descriptor, aspectObject) {
    Object.defineProperty(target, key, {
        value: aspectObject.overload(descriptor.value),
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
    });
}
function getDescriptors(target, aspectObject) {
    return Object.getOwnPropertyNames(target)
        .filter(key => key !== "constructor")
        .map(key => ({ key: key, descriptor: Object.getOwnPropertyDescriptor(target, key) }));
}
function functionAspect(target, key, descriptor, aspectObject) {
    if (descriptor.get || descriptor.set) {
        descriptor.get = descriptor.get ? aspectObject.overload(descriptor.get) : undefined;
        descriptor.set = descriptor.set ? aspectObject.overload(descriptor.set) : undefined;
    }
    else if (descriptor.value) {
        descriptor.value = aspectObject.overload(descriptor.value);
    }
    return descriptor;
}
//# sourceMappingURL=aspect.js.map