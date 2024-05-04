import {
    AnyType,
    FunctionType,
    ObjectMiddlewareAssignParams,
    ObjectMiddlewareContinueParams,
    ObjectMiddlewareDeleteOriginProps,
    ObjectMiddlewareDeleteProps,
    ObjectMiddlewareFunctionTypes,
    ObjectMiddlewareInitType,
    ObjectMiddlewareMethodProps,
    ObjectMiddlewareOriginType,
    ObjectMiddlewareRecreateProps,
    ObjectMiddlewareSaveOrigin,
    ObjectMiddlewareType
} from "./types";

export * from "./types";
/* @internal */
export { INSTANCE_INIT_INDEX, INSTANCE_ORIGIN_INDEX, PROTOTYPE_INIT_INDEX, PROTOTYPE_ORIGIN_INDEX };

const INSTANCE_INIT_INDEX = Symbol("__init__");
const INSTANCE_ORIGIN_INDEX = Symbol("__origin__");
const PROTOTYPE_INIT_INDEX = Symbol("__protototype_init__");
const PROTOTYPE_ORIGIN_INDEX = Symbol("__protototype_origin__");

type MObject<T> = NonNullable<unknown> & {
    [key in keyof T as Exclude<key, "constructor">]: AnyType;
} & {
    [INSTANCE_INIT_INDEX]?: ObjectMiddlewareInitType<T>[];
    [INSTANCE_ORIGIN_INDEX]?: ObjectMiddlewareOriginType[];
    [PROTOTYPE_INIT_INDEX]?: ObjectMiddlewareInitType<T>[];
    [PROTOTYPE_ORIGIN_INDEX]?: ObjectMiddlewareOriginType[];
};

type InitIndex = typeof INSTANCE_INIT_INDEX | typeof PROTOTYPE_INIT_INDEX;
type OriginIndex = typeof INSTANCE_ORIGIN_INDEX | typeof PROTOTYPE_ORIGIN_INDEX;
type Init<T> = [T, InitIndex, OriginIndex];

const assignNewMethod = <T>({
    key,
    newMethod,
    object,
    originDefinedInPrototype,
    originMethod,
    prototype
}: ObjectMiddlewareAssignParams<T>) => {
    if (
        originDefinedInPrototype &&
        prototype !== object &&
        originMethod === newMethod &&
        prototype[key] &&
        typeof object === "object" &&
        object !== null &&
        key in object
    ) {
        delete object[key];
    } else {
        object[key] = newMethod;
    }
};

const continueCondition = <T>({
    initIndex,
    key,
    object,
    methodName
}: ObjectMiddlewareContinueParams<T, InitIndex>) => {
    methodName = !Array.isArray(methodName) ? (methodName ? [methodName] : []) : methodName;
    return (
        typeof object[key] !== "function" ||
        key === "constructor" ||
        (methodName.length > 0 && !methodName.includes(key)) ||
        !(typeof object === "object" && object !== null && initIndex in object)
    );
};

const createResource = <T extends NonNullable<unknown>, V>(
    object: T,
    propertyKey: symbol,
    value: V
) => {
    if (!(propertyKey in object)) {
        Object.defineProperty(object, propertyKey, {
            configurable: false,
            enumerable: false,
            value,
            writable: false
        });
    }
};

const createMiddlewareMethod = <T>({
    currentMethod,
    key,
    middleware,
    type
}: ObjectMiddlewareMethodProps<T>) => {
    if (
        type === ObjectMiddlewareType.AFTER &&
        (isAsyncMethod(currentMethod) || isAsyncMethod(middleware))
    ) {
        const method = async function (...args: Parameters<typeof currentMethod>) {
            const result = await currentMethod.call(this, ...args);

            await middleware(
                {
                    methodName: key,
                    ref: this,
                    result
                },
                ...args
            );

            return result;
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (type === ObjectMiddlewareType.AFTER) {
        const method = function (...args: Parameters<typeof currentMethod>) {
            const result = currentMethod.call(this, ...args);

            middleware(
                {
                    methodName: key,
                    ref: this,
                    result
                },
                ...args
            );

            return result;
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (
        type === ObjectMiddlewareType.BEFORE &&
        (isAsyncMethod(currentMethod) || isAsyncMethod(middleware))
    ) {
        const method = async function (...args: Parameters<typeof currentMethod>) {
            await middleware(
                {
                    methodName: key,
                    ref: this
                },
                ...args
            );
            return currentMethod.call(this, ...args);
        };
        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (type === ObjectMiddlewareType.BEFORE) {
        const method = function (...args: Parameters<typeof currentMethod>) {
            middleware(
                {
                    methodName: key,
                    ref: this
                },
                ...args
            );
            return currentMethod.call(this, ...args);
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (
        type === ObjectMiddlewareType.CONDITION_AFTER &&
        (isAsyncMethod(currentMethod) || isAsyncMethod(middleware))
    ) {
        const method = async function (...args: Parameters<typeof currentMethod>) {
            const result = currentMethod.call(this, ...args);
            if (await middleware({ methodName: key, ref: this, result }, ...args)) {
                return result;
            }
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (type === ObjectMiddlewareType.CONDITION_AFTER) {
        const method = function (...args: Parameters<typeof currentMethod>) {
            const result = currentMethod.call(this, ...args);

            if (middleware({ methodName: key, ref: this, result }, ...args)) {
                return result;
            }
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (
        type === ObjectMiddlewareType.CONDITION_BEFORE &&
        (isAsyncMethod(currentMethod) || isAsyncMethod(middleware))
    ) {
        const method = async function (...args: Parameters<typeof currentMethod>) {
            if (await middleware({ methodName: key, ref: this }, ...args)) {
                return currentMethod.call(this, ...args);
            }
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (type === ObjectMiddlewareType.CONDITION_BEFORE) {
        const method = function (...args: Parameters<typeof currentMethod>) {
            if (middleware({ methodName: key, ref: this }, ...args)) {
                return currentMethod.call(this, ...args);
            }
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    if (type === ObjectMiddlewareType.OVERRIDE) {
        const method = function (...args: Parameters<typeof currentMethod>) {
            return middleware(
                {
                    methodName: key,
                    ref: this,
                    result: currentMethod.call(this, ...args)
                },
                ...args
            );
        };

        Object.defineProperty(method, "name", {
            value: currentMethod.name,
            writable: false
        });

        return method;
    }

    return currentMethod;
};

const deleteAllMiddlewares = <T>(key: string, resource: ObjectMiddlewareInitType<T>[]) => {
    if (!resource) {
        return;
    }

    for (let index = resource.length - 1; index >= 0; index--) {
        const [_key] = resource[index];

        if (_key === key) {
            resource.splice(index, 1);
        }
    }
};

const deleteOriginMethod = <T extends MObject<T>>({
    key,
    newMethod,
    object,
    originIndex,
    originMethod
}: ObjectMiddlewareDeleteOriginProps<T, OriginIndex>) => {
    if (originMethod !== newMethod || !(originIndex in object)) {
        return;
    }

    const index = object[originIndex]!.findIndex(([_key]) => _key === key);

    if (index !== -1) {
        object[originIndex]!.splice(index, 1);
    }
};

const deleteMiddleware = <T>({
    key,
    middleware,
    resource,
    type
}: ObjectMiddlewareDeleteProps<T>) => {
    const index = resource.findIndex(
        ([_key, _middleware, _type]) => _key === key && _middleware === middleware && _type === type
    );

    if (index !== -1) {
        resource.splice(index, 1);
    }
};

const getOriginMethod = <T extends MObject<T>>(
    object: T,
    key: string,
    originIndex: OriginIndex
): [FunctionType | undefined, boolean | undefined] => {
    if (originIndex in object) {
        const [, originMethod, originDefinedInPrototype] =
            object[originIndex]!.find(([_key]) => _key === key) || [];

        return [originMethod, originDefinedInPrototype];
    }

    return [undefined, undefined];
};

const getPrototypeOf = <T>(object: T): T => {
    const prototype = Object.getPrototypeOf(object);

    return prototype.constructor === Object ? object : prototype;
};

const isAsyncMethod = (method: FunctionType) =>
    method instanceof Promise || method.constructor.name === "AsyncFunction";

const recreateMiddlewareMethods = <T extends MObject<T>>({
    key,
    originMethod,
    resource
}: ObjectMiddlewareRecreateProps<T>) => {
    let newMethod = originMethod;

    for (const [, middleware, type] of resource) {
        newMethod = createMiddlewareMethod({
            currentMethod: newMethod,
            key,
            middleware,
            type
        });
    }

    return newMethod;
};

const saveOriginMethod = <T extends MObject<T>>({
    key,
    object,
    originDefinedInPrototype,
    originIndex,
    originMethod
}: ObjectMiddlewareSaveOrigin<T, OriginIndex>) => {
    if (originIndex in object && !object[originIndex]!.find(([_key]) => _key === key)) {
        object[originIndex]!.push([key, originMethod, originDefinedInPrototype]);
    }
};

/**
 * Subscribe a middleware to all methods or to specific methods (constructor is excluded)
 * Types of the middleware:
 *    [AFTER]: the middleware is performed after an object method
 *    [BEFORE]: the middleware is performed before an object method
 *    [CONDITION_AFTER]: an object method is performed, then the middleware is performed; if the meddleware's return is true, the return is the object method return. Otherwise will return undefined
 *    [CONDITION_BEFORE]: an object method is performed if the return of the middleware is true
 *    [OVERRIDE]: middleware can overwrite the return of an object method
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param type Type of the middleware
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param subscribeInPrototype If is set to true, middleware will be subscribed in prototype = all instances of the parent class will be affected
 */
export const subscribe = <T extends MObject<T>>(
    object: T,
    middleware: ObjectMiddlewareFunctionTypes<T>[typeof type],
    type: ObjectMiddlewareType = ObjectMiddlewareType.BEFORE,
    methodName: string | string[] = [],
    subscribeInPrototype: boolean = false
) => {
    if (
        Array.isArray(object) ||
        object === null ||
        typeof object !== "object" ||
        typeof middleware !== "function"
    ) {
        throw "First parameter must be an object";
    }

    const prototype = getPrototypeOf(object);
    const [subscriptionObject, initIndex, originIndex]: Init<T> = subscribeInPrototype
        ? [prototype, PROTOTYPE_INIT_INDEX, PROTOTYPE_ORIGIN_INDEX]
        : [object, INSTANCE_INIT_INDEX, INSTANCE_ORIGIN_INDEX];

    createResource(subscriptionObject, initIndex, [] as ObjectMiddlewareInitType<T>[]);
    createResource(subscriptionObject, originIndex, [] as ObjectMiddlewareOriginType[]);

    for (const key of Object.getOwnPropertyNames(prototype)) {
        const currentMethod = subscriptionObject[key];

        if (
            continueCondition({
                initIndex,
                object: subscriptionObject,
                key,
                methodName
            })
        ) {
            continue;
        }

        saveOriginMethod({
            key,
            object: subscriptionObject,
            originDefinedInPrototype: !Object.keys(object).includes(key),
            originIndex,
            originMethod: currentMethod
        });

        if (
            !subscriptionObject[initIndex]!.find(
                ([_key, _middleware, _type]) =>
                    _key === key && _middleware === middleware && _type === type
            )
        ) {
            subscriptionObject[initIndex]!.push([key, middleware, type]);
            subscriptionObject[key] = createMiddlewareMethod({
                currentMethod,
                key,
                middleware,
                type
            });
        }
    }
};

/**
 * Type-safe subscribe function (for TypeScript only). This method doesn't work with private methods.
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param methodName Name of a method
 * @param type Type of the middleware
 * @param subscribeInPrototype If is set to true, middleware will be subscribed in prototype = all instances of the parent class will be affected
 */
export const subscribeTypeSafe = <
    T extends MObject<T>,
    Method extends keyof T & {
        [Property in keyof T[Method]]: FunctionType;
    }
>(
    object: T,
    middleware: ObjectMiddlewareFunctionTypes<T, ReturnType<T[Method]>>[typeof type],
    methodName: Method,
    type: ObjectMiddlewareType,
    subscribeInPrototype: boolean = false
) => {
    subscribe(object, middleware, type, methodName.toString(), subscribeInPrototype);
};

/**
 * Unsubscribe middleware
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param type Type of the middleware
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param unsubscribeInPrototype If is set to true, middleware will be unsubscribed in prototype = all instances of the parent class will be affected
 */
export const unsubscribe = <T extends MObject<T>>(
    object: T,
    middleware: ObjectMiddlewareFunctionTypes<T>[typeof type],
    type: ObjectMiddlewareType = ObjectMiddlewareType.BEFORE,
    methodName: string | string[] = [],
    unsubscribeInPrototype: boolean = false
) => {
    if (typeof object !== "object" || typeof middleware !== "function") {
        return;
    }

    const prototype = getPrototypeOf(object);
    const [unsubscriptionObject, initIndex, originIndex]: Init<T> = unsubscribeInPrototype
        ? [prototype, PROTOTYPE_INIT_INDEX, PROTOTYPE_ORIGIN_INDEX]
        : [object, INSTANCE_INIT_INDEX, INSTANCE_ORIGIN_INDEX];

    for (const key of Object.getOwnPropertyNames(prototype)) {
        if (
            continueCondition({
                initIndex,
                object: unsubscriptionObject,
                key,
                methodName
            })
        ) {
            continue;
        }

        const [originMethod, originDefinedInPrototype] = getOriginMethod(
            unsubscriptionObject,
            key,
            originIndex
        );

        if (originMethod) {
            deleteMiddleware({
                key,
                resource: unsubscriptionObject[initIndex]!,
                middleware,
                type
            });

            const newMethod = recreateMiddlewareMethods({
                key,
                originMethod,
                resource: unsubscriptionObject[initIndex]!.filter(
                    ([_key, _middleware]) => _key === key && _middleware === middleware
                )
            });

            deleteOriginMethod({
                key,
                newMethod,
                object: unsubscriptionObject,
                originIndex,
                originMethod
            });

            assignNewMethod({
                key,
                newMethod,
                object: unsubscriptionObject,
                originDefinedInPrototype,
                originMethod,
                prototype
            });
        }
    }
};

/**
 * Unsubscribe all
 *
 * @param object Subject object
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param unsubscribeInPrototype If is set to true, middleware will be unsubscribed in prototype = all instances of the parent class will be affected
 */
export const unsubscribeAll = <T extends MObject<T>>(
    object: T,
    methodName: string | string[] = [],
    unsubscribeInPrototype: boolean = false
) => {
    if (typeof object !== "object") {
        return;
    }

    const prototype = getPrototypeOf(object);
    const [unsubscriptionObject, initIndex, originIndex]: Init<T> = unsubscribeInPrototype
        ? [prototype, PROTOTYPE_INIT_INDEX, PROTOTYPE_ORIGIN_INDEX]
        : [object, INSTANCE_INIT_INDEX, INSTANCE_ORIGIN_INDEX];

    for (const key of Object.getOwnPropertyNames(prototype)) {
        if (
            continueCondition({
                initIndex,
                object: unsubscriptionObject,
                key,
                methodName
            })
        ) {
            continue;
        }

        const [originMethod, originDefinedInPrototype] = getOriginMethod(
            unsubscriptionObject,
            key,
            originIndex
        );

        if (originMethod) {
            deleteAllMiddlewares(key, unsubscriptionObject[initIndex]!);

            deleteOriginMethod({
                key,
                newMethod: originMethod,
                object: unsubscriptionObject,
                originIndex,
                originMethod
            });

            assignNewMethod({
                key,
                newMethod: originMethod,
                object: unsubscriptionObject,
                originDefinedInPrototype,
                originMethod,
                prototype
            });
        }
    }
};
