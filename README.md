# object-middleware

[![NPM](https://img.shields.io/npm/v/object-middleware.svg)](https://www.npmjs.com/package/object-middleware)

## Install

```bash
npm install object-middleware
yarn add object-middleware
```

## About

This simple function should help with subscribing middlewares to methods of an object. It helps when you use a 3rd party package and you would like to inject your own logic into them. For example when you use MongoDb and you would like to validate the response from the database.

## Using

```ts
/**
 * Subscribe a middleware to all methods or to specific methods (constructor is excluded)
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param type Type of the middleware
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param subscribeInPrototype If is set to true, middleware will be subscribed in prototype = all instances of the parent class will be affected
 */
subscribe(
  object,
  middleware,
  type = ObjectMiddlewareType.BEFORE,
  methodName = [],
  subscribeInPrototype = false
)
```

```ts
/**
 * Type-safe subscribe function (for TypeScript only). This method doesn't work with private methods.
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param methodName Name of a method
 * @param type Type of the middleware
 * @param subscribeInPrototype If is set to true, middleware will be subscribed in prototype = all instances of the parent class will be affected
 */
subscribeTypeSafe(
  object,
  middleware,
  methodName,
  type,
  subscribeInPrototype = false
)
```

```ts
/**
 * Unsubscribe middleware
 *
 * @param object Subject object
 * @param middleware Middleware function
 * @param type Type of the middleware
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param unsubscribeInPrototype If is set to true, middleware will be unsubscribed in prototype = all instances of the parent class will be affected
 */
unsubscribe(
  object,
  middleware,
  type = ObjectMiddlewareType.BEFORE,
  methodName = [],
  unsubscribeInPrototype = false
)
```

```ts
/**
 * Unsubscribe all
 *
 * @param object Subject object
 * @param methodName Name of a method or list of method names, if is not specified or an empty array, all methods will be touched
 * @param unsubscribeInPrototype If is set to true, middleware will be unsubscribed in prototype = all instances of the parent class will be affected
 */
const unsubscribeAll = (
  object,
  methodName = [],
  unsubscribeInPrototype = false
)
```

More info in the example section.

## Documentation

**Middleware types**:

`AFTER`: the middleware is performed after an object method

`BEFORE`: the middleware is performed before an object method

`CONDITION_AFTER`: an object method is performed, then the middleware is performed; if the meddleware's return is true, the return is the object method return. Otherwise will return undefined

`CONDITION_BEFORE`: an object method is performed if the return of the middleware is true

`OVERRIDE`: middleware can overwrite the return of an object method

**Middleware function**:

Middleware function will receive at least one parameter. First parameter is an object with reference to the object where the middleware is subscribed, the name of the method where the middleware is subscribed and the result from the origin method. The result is passed only in types `AFTER`, `CONDITION_AFTER` and `OVERRIDE`.

```ts
type ObjectMiddlewareParams<T, R = any> = {
  methodName: string; // name of the origin method
  ref: T; // reference to the origin object
  result?: R; // result of the origin method; undefined in types BEFORE and CONDITION_BEFORE
}
```

As next parameters are passed parameters from the origin object method.

```ts
class MyClass {
  method(prop1: number, prop2: string) {} // origin method
}

const myObject = new MyClass(); // origin object

// if this middleware will be subscribed to the myObject.method then as the second and third parameter will be passed parameter from the origin method
const middleware = <T>(ref: ObjectMiddlewareParams<T>, prop1: number, prop2: string)

// or

const middleware = <T>(ref: ObjectMiddlewareParams<T>, ...props: any[])
```

## Examples

```ts
class MyClass {
  myMethod() {
    console.log("myMethod");
  }
  myReturn() {
    console.log("myReturn");
    return 123;
  }
  passProps(prop1: number, prop2: string) {
    console.log("passProps");
    return `${prop1}${prop2}`;
  }
}

const myObject = new MyClass();
```

`AFTER` - The middleware is performed after an object method.

```ts
const middleware = () => {
  console.log("middleware");
};

subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.AFTER
);
myObject.myMethod(); // CALL the METHOD

// console:
//    myMethod
//    middleware
```

`BEFORE` - The middleware is performed before an object method.

```ts
const middleware = () => {
  console.log("middleware");
};

subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.BEFORE
);
myObject.myMethod(); // CALL the METHOD

// console:
//    middleware
//    myMethod
```

`CONDITION_AFTER` - An object method is performed, then the middleware is performed; the meddleware's return is `true`, than the return is the object method return.

```ts
const middleware = () => {
  console.log("middleware");
  return true;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.CONDITION_AFTER
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    myReturn
//    middleware
//    123
```

`CONDITION_AFTER` - An object method is performed, then the middleware is performed; the meddleware's return is `false`, than the return is undefined.

```ts
const middleware = () => {
  console.log("middleware");
  return false;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.CONDITION_AFTER
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    myReturn
//    middleware
//    undefined
```

`CONDITION_BEFORE` - An object method is performed because the middleware's return is `true`.

```ts
const middleware = () => {
  console.log("middleware");
  return true;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.CONDITION_BEFORE
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    middleware
//    myReturn
//    123
```

`CONDITION_BEFORE` - An object method is not performed because the middleware's return is `false`.

```ts
const middleware = () => {
  console.log("middleware");
  return false;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.CONDITION_BEFORE
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    middleware
//    undefined
```

`OVERRIDE` - Middleware will overwrite the return of an object method.

```ts
const middleware = () => {
  console.log("middleware");
  return 987;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.OVERRIDE
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    myReturn
//    middleware
//    987
```

`OVERRIDE` - Middleware will return the return of an object method.

```ts
const middleware = (ref) => {
  console.log("middleware");
  return ref.result;
};

subscribe(
  myObject,
  middleware,
  ObjectMiddlewareType.OVERRIDE
);
console.log(myObject.myReturn()); // CALL the METHOD

// console:
//    myReturn
//    middleware
//    123
```

Passing properties

```ts
const middleware = (
  ref: ObjectMiddlewareParams<MyClass>, 
  ...props: any
) => {
  console.log(ref);
  console.log(props);
};

subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.AFTER
);
myObject.passProps(55, "abcd"); // CALL the METHOD

// console:
//     {
//       methodName: 'passProps',
//       ref: MyClass {
//         myMethod: [Function (anonymous)],
//         myReturn: [Function (anonymous)],
//         passProps: [Function (anonymous)]
//       },
//       result: "55abcd"
//     }
//     [ 55, 'abcd' ]
```

## More Examples

Working with simple object and TypeScript type-safe using. Trying to subsribe in a private method or anything else except for a method type will cause a TypeScript error.

```ts
const myObject = {
  myMethod: (num: number): number => {
    return num;
  }
};

const middleware: ObjectMiddlewareFunction<
  typeof myObject,
  typeof myObject["myMethod"]
> = (ref, num: number) => {
  return ref.result && num > 10 ? ref.result : 0;
};

subscribeTypeSafe(
  myObject,
  middleware,
  "myMethod",
  ObjectMiddlewareType.OVERRIDE
);

console.log(myObject.myMethod(9));
console.log(myObject.myMethod(11));

// console:
//    0
//    11
```

This code will cause an error.

```ts
class MyClass {
  private myMethod() {

  }
}

const myClass = new MyClass();

const myObject = {
  myMethod: 5
};


const middleware = () => {};

// this code will cause an error because myMetod doesn't exist in myClass (because it is private we can't access to it)
subscribeTypeSafe(
  myClass,
  middleware,
  "myMethod",
  ObjectMiddlewareType.BEFORE
);

// this code will cause an error because myObject.myMethod is not a function
subscribeTypeSafe(
  myObject,
  middleware,
  "myMethod",
  ObjectMiddlewareType.BEFORE
);

```

Subscribe the middleware only to "passProps" method.

```ts
subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.BEFORE,
  [myObject.passProps.name]
);
```

ASYNC functions and Promises work as well.

```ts
class MyClass {
  async passProps(prop: number) {
    return prop;
  }
}

const myObject = new MyClass();

const middleware = async (
  ref: ObjectMiddlewareParams<MyClass>, 
  prop: number
) => {
  return prop > 10;
};

subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.CONDITION_BEFORE
);

console.log(await myObject.passProps(5))

// comsole:
//    undefined

console.log(await myObject.passProps(11))

// comsole:
//    11
```

Overriding a private method works as well.

```ts
class MyClass {
  private privateMethod(prop: number) {
    return prop;
  }
  publicMethod(prop: number) {
    return this.privateMethod(prop);
  }
}

const myObject = new MyClass();

const middleware = (
  ref: ObjectMiddlewareParams<MyClass>, 
  prop: number
) => {
  return prop * 2;
};

subscribe(
  myObject, 
  middleware, 
  ObjectMiddlewareType.OVERRIDE,
  ["privateMethod"]
);

console.log(myObject.publicMethod(5))

// console:
//    10
```

Subscribing a middleware to the prototype of an object. This will affect all objects created from the same class.

```ts
class MyClass {
  constructor(private num: number) {}
  testMethod(num: number) {
    return this.num;
  }
}

const myObject1 = new MyClass(4);
const myObject2 = new MyClass(6);
const myObject3 = new MyClass(8);

const middleware: ObjectMiddlewareOverrideFunction<MyClass> = (
  ref: ObjectMiddlewareParams<MyClass>,
  num: number
) => {
  return ref.result * num;
};

subscribe(
  myObject1,
  middleware,
  ObjectMiddlewareType.OVERRIDE,
  [],
  true
);

console.log(myObject1.testMethod(2));
console.log(myObject2.testMethod(4));
console.log(myObject3.testMethod(6));

// console:
//    8
//    24
//    48
```

Subscribing a middleware in the prototype and add another middleware to single instance.

```ts
class TestClass {
  constructor() {}
  testMethod() {
    return 0;
  }
}

const testObject1 = new TestClass();
const testObject2 = new TestClass();

const middleware1 = () => 15;
const middleware2 = () => 20;

subscribe(
  testObject1,
  middleware1,
  ObjectMiddlewareType.OVERRIDE,
  [],
  true
);

console.log(testObject1.testMethod());
console.log(testObject2.testMethod());

// console:
//    15
//    15

subscribe(
  testObject2,
  middleware2,
  ObjectMiddlewareType.OVERRIDE
);

console.log(testObject1.testMethod());
console.log(testObject2.testMethod());

// console:
//    15
//    20

// this must be called before unsubscribeAll
unsubscribe(
  testObject2,
  middleware2,
  ObjectMiddlewareType.OVERRIDE
);

unsubscribeAll(testObject2, [], true);

console.log(testObject1.testMethod());
console.log(testObject2.testMethod());

// console:
//    0
//    0
```

## Note

When you subsribe a middleware in the prototype and then you use `unsubscribeAll`, the middleware will be ubsubscribed in all instances. You can subscribe a middleware in the prototype and then subscribe another middleware in a single instance.

When you combine subscribing in a prototype and in a instance, you need to unsubscribe them in the correct order.

## License

MIT © [MartinTichovsky](https://github.com/MartinTichovsky)
