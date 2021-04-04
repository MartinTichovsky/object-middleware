import {
  instanceInitIndex,
  instanceOriginIndex,
  ObjectMiddlewareType,
  prototypeInitIndex,
  subscribe,
  unsubscribe,
  unsubscribeAll
} from ".";
import {
  ObjectMiddlewareOverrideFunction,
  ObjectMiddlewareParams
} from "./types";

const symbol1 = Symbol("__unique_1__");
const symbol2 = Symbol("__unique_2__");

class MyClass {
  property1: number;
  property2: string;
  constructor() {}
  method() {}
  method1() {
    return symbol1;
  }
  method2() {
    return symbol2;
  }
  method3(param1: string, param2: number, param3: boolean) {
    return [param1, param2, param3];
  }
  method4() {
    return 999;
  }
  method5(param1: string, param2: number, param3: boolean, symbol: Symbol) {
    return [param1, param2, param3, symbol];
  }
  private method6() {
    return "AbC";
  }
  method7() {
    return this.method6();
  }
}

const getMethodsCount = <T>(myObject: T) => {
  const prototype = Object.getPrototypeOf(myObject);
  return Object.getOwnPropertyNames(prototype).filter(
    (key) => typeof prototype[key] === "function" && key !== "constructor"
  ).length;
};

describe("Subscribe", () => {
  test("All Methods Must Have Middleware", () => {
    const myObject = new MyClass();
    const methodsCount = getMethodsCount(myObject);
    const middleware = () => {};

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    expect(myObject[instanceInitIndex].length).toBe(methodsCount);

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    expect(myObject[instanceInitIndex].length).toBe(methodsCount * 2);

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    expect(myObject[instanceInitIndex].length).toBe(methodsCount * 3);

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    expect(myObject[instanceInitIndex].length).toBe(methodsCount * 4);

    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    expect(myObject[instanceInitIndex].length).toBe(methodsCount * 5);
  });

  test("Only Selection of Methods Must Have Middleware", () => {
    const myObject = new MyClass();
    const middleware = () => {};
    const methodList = [myObject.method.name];

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER, methodList);
    expect(myObject[instanceInitIndex].length).toBe(1);

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE, methodList);
    expect(myObject[instanceInitIndex].length).toBe(2);

    subscribe(
      myObject,
      middleware,
      ObjectMiddlewareType.CONDITION_AFTER,
      methodList
    );
    expect(myObject[instanceInitIndex].length).toBe(3);

    subscribe(
      myObject,
      middleware,
      ObjectMiddlewareType.CONDITION_BEFORE,
      methodList
    );
    expect(myObject[instanceInitIndex].length).toBe(4);

    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE, "method");
    expect(myObject[instanceInitIndex].length).toBe(5);
  });
});

describe("Unsubscribe", () => {
  test("Main Functionality", () => {
    const myObject = new MyClass();
    const middleware = () => {};

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    expect(
      myObject[instanceInitIndex].filter(
        ([, _middleware]) => _middleware === middleware
      ).length
    ).toBe(0);
  });

  test("Unsubscribe Selection of Methods", () => {
    const myObject = new MyClass();
    const middleware = () => {};
    const methodList = [myObject.method.name];

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER, methodList);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.AFTER, methodList);
    expect(
      myObject[instanceInitIndex].filter(
        ([, _middleware]) => _middleware === middleware
      ).length
    ).toBe(0);
  });

  test("Unsubscribe Selection of Methods - Others Must not be Touched", () => {
    const myObject = new MyClass();
    const middleware = () => {};
    const methodList = [myObject.method.name];

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER, [
      ...methodList,
      myObject.method1.name
    ]);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.AFTER, methodList);
    expect(
      myObject[instanceInitIndex].filter(
        ([, _middleware]) => _middleware === middleware
      ).length
    ).toBe(1);
  });

  test("Remove Different Middleware Doesn't Affect the Others", () => {
    const myObject = new MyClass();
    const methodsCount = getMethodsCount(myObject);
    const middleware = () => {};

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    expect(
      myObject[instanceInitIndex].filter(
        ([, _middleware]) => _middleware === middleware
      ).length
    ).toBe(methodsCount);

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    expect(
      myObject[instanceInitIndex].filter(
        ([, _middleware]) => _middleware === middleware
      ).length
    ).toBe(methodsCount * 2);
  });

  test("Origin Methods Mustn't Remain", () => {
    const myObject = new MyClass();
    const middleware = () => {};

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    expect(myObject[instanceOriginIndex].length).toBe(0);
  });

  test("Origin Method Should Not be Changed", () => {
    const myObject = new MyClass();
    const middleware = () => {};
    const method = myObject.method;

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    unsubscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    expect(myObject.method === method).toBeTruthy();
  });
});

describe("Unsubscribe All", () => {
  test("Main Functionality", () => {
    const myObject1 = new MyClass();
    const myObject2 = new MyClass();
    const middleware = () => {};
    const methodsCount = getMethodsCount(myObject1);

    subscribe(myObject1, middleware, ObjectMiddlewareType.AFTER);
    unsubscribeAll(myObject1);
    expect(myObject1[instanceInitIndex].length).toBe(0);
    expect(myObject2[instanceInitIndex]).toBe(undefined);

    subscribe(myObject1, middleware, ObjectMiddlewareType.AFTER);
    subscribe(myObject2, middleware, ObjectMiddlewareType.AFTER);
    unsubscribeAll(myObject1);
    expect(myObject1[instanceInitIndex].length).toBe(0);
    expect(myObject2[instanceInitIndex].length).toBe(methodsCount);

    unsubscribeAll(myObject2);
    expect(myObject2[instanceInitIndex].length).toBe(0);

    subscribe(myObject1, middleware, ObjectMiddlewareType.AFTER);
    subscribe(myObject1, middleware, ObjectMiddlewareType.BEFORE);
    subscribe(myObject1, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    subscribe(myObject1, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    subscribe(myObject1, middleware, ObjectMiddlewareType.OVERRIDE);
    unsubscribeAll(myObject1);
    expect(myObject1[instanceInitIndex].length).toBe(0);
  });

  test("Unsubscribe Methods In List", () => {
    const myObject = new MyClass();
    const methodsCount = getMethodsCount(myObject);
    const middleware = () => {};

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    unsubscribeAll(myObject, "method");
    expect(myObject[instanceInitIndex].length).toBe(methodsCount - 1);
    unsubscribeAll(myObject);
    expect(myObject[instanceInitIndex].length).toBe(0);

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    unsubscribeAll(myObject, [myObject.method1.name]);
    expect(myObject[instanceInitIndex].length).toBe((methodsCount - 1) * 2);
  });
});

describe("Correct Order of Performing Functions", () => {
  test("AFTER - Must be Triggered After Origin Method", () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(1);
      }
    })();
    const middleware = () => {
      order.push(2);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("[ASYNC] AFTER - Must be Triggered After Origin Method", async () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      async method() {
        order.push(1);
      }
    })();
    const middleware = async () => {
      order.push(2);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    await myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("BEFORE - Must be Triggered Before Origin Method", () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(2);
      }
    })();
    const middleware = () => {
      order.push(1);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("[ASYNC] BEFORE - Must be Triggered Before Origin Method", async () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      async method() {
        order.push(2);
      }
    })();
    const middleware = async () => {
      order.push(1);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    await myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("CONDITION_AFTER - Must be Triggered After Origin Method", () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(1);
      }
    })();
    const middleware = () => {
      order.push(2);
      return true;
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("[ASYNC] CONDITION_AFTER - Must be Triggered After Origin Method", async () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      async method() {
        order.push(1);
      }
    })();
    const middleware = async () => {
      order.push(2);
      return true;
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    await myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("CONDITION_BEFORE - Must be Triggered Before Origin Method", () => {
    let order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(2);
      }
    })();
    const middleware1 = () => {
      order.push(1);
      return true;
    };
    const middleware2 = () => {
      order.push(1);
      return false;
    };

    subscribe(myObject, middleware1, ObjectMiddlewareType.CONDITION_BEFORE);
    myObject.method();
    expect(order).toEqual([1, 2]);

    order = [];

    subscribe(myObject, middleware2, ObjectMiddlewareType.CONDITION_BEFORE);
    myObject.method();
    expect(order).toEqual([1]);
  });

  test("[ASYNC] CONDITION_BEFORE - Must be Triggered After Origin Method", async () => {
    let order: number[] = [];
    const myObject = new (class TestClass {
      async method() {
        order.push(2);
      }
    })();
    const middleware1 = async () => {
      order.push(1);
      return true;
    };
    const middleware2 = async () => {
      order.push(1);
      return false;
    };

    subscribe(myObject, middleware1, ObjectMiddlewareType.CONDITION_BEFORE);
    await myObject.method();
    expect(order).toEqual([1, 2]);

    order = [];

    subscribe(myObject, middleware2, ObjectMiddlewareType.CONDITION_BEFORE);
    await myObject.method();
    expect(order).toEqual([1]);
  });

  test("[ASYNC] CONDITION_BEFORE - Must be Triggered After Origin Method - Assign async method to non async method", async () => {
    let order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(2);
      }
    })();
    const middleware1 = async () => {
      order.push(1);
      return true;
    };
    const middleware2 = async () => {
      order.push(1);
      return false;
    };

    subscribe(myObject, middleware1, ObjectMiddlewareType.CONDITION_BEFORE);
    await myObject.method();
    expect(order).toEqual([1, 2]);

    order = [];

    subscribe(myObject, middleware2, ObjectMiddlewareType.CONDITION_BEFORE);
    await myObject.method();
    expect(order).toEqual([1]);
  });

  test("OVERRIDE - Must be Triggered Before Origin Method", () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      method() {
        order.push(1);
      }
    })();
    const middleware = () => {
      order.push(2);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    myObject.method();
    expect(order).toEqual([1, 2]);
  });

  test("[ASYNC] OVERRIDE - Must be Triggered After Origin Method", async () => {
    const order: number[] = [];
    const myObject = new (class TestClass {
      async method() {
        order.push(1);
      }
    })();
    const middleware = async () => {
      order.push(2);
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    await myObject.method();
    expect(order).toEqual([1, 2]);
  });
});

describe("Returns", () => {
  test("Return Isn't Touched", () => {
    const myObject = new MyClass();
    const middleware = () => {
      return true;
    };

    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    expect(myObject.method1()).toBe(symbol1);

    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    expect(myObject.method1()).toBe(symbol1);

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    expect(myObject.method1()).toBe(symbol1);

    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    expect(myObject.method1()).toBe(symbol1);
  });

  test("Override Middleware", () => {
    const myObject = new MyClass();
    const middleware1 = () => {
      return 123;
    };
    const middleware2: ObjectMiddlewareOverrideFunction<MyClass> = function (
      _,
      param1: string,
      param2: number,
      param3: boolean
    ) {
      return [param3, param2, param1];
    };
    const params: [string, number, boolean] = ["A", 1, false];

    subscribe(myObject, middleware1, ObjectMiddlewareType.OVERRIDE);
    expect(myObject.method1()).toBe(123);

    unsubscribe(myObject, middleware1, ObjectMiddlewareType.OVERRIDE);
    subscribe(myObject, middleware2, ObjectMiddlewareType.OVERRIDE);
    expect(myObject.method3(params[0], params[1], params[2])).toEqual(
      params.reverse()
    );
  });

  test("Override Private Method", () => {
    const myObject = new MyClass();
    const middleware = () => {
      return 123;
    };
    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE, ["method6"]);
    expect(myObject.method7()).toBe(123);
  });
});

test("Contains Reference, Resource and Name", () => {
  const myObject = new MyClass();
  const middleware: ObjectMiddlewareOverrideFunction<MyClass> = function (
    ref: ObjectMiddlewareParams<MyClass>
  ) {
    expect(ref.ref).toEqual(myObject);
    expect(ref.methodName).toBe("method4");
    expect(ref.result).toBe(999);
  };

  subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
  myObject.method4();
});

describe("Parameters Must be Passed", () => {
  const myObject = new MyClass();
  const params: [string, number, boolean, symbol] = [
    "A",
    1,
    false,
    Symbol("__unique__")
  ];
  const middleware: ObjectMiddlewareOverrideFunction<MyClass> = function (
    _,
    param1: string,
    param2: number,
    param3: boolean,
    param4: symbol
  ) {
    expect(param1).toEqual(params[0]);
    expect(param2).toEqual(params[1]);
    expect(param3).toEqual(params[2]);
    expect(param4).toEqual(params[3]);
  };
  test("Type - AFTER", () => {
    subscribe(myObject, middleware, ObjectMiddlewareType.AFTER);
    myObject.method5(...params);
  });

  test("Type - BEFORE", () => {
    subscribe(myObject, middleware, ObjectMiddlewareType.BEFORE);
    myObject.method5(...params);
  });

  test("Type - CONDITION_AFTER", () => {
    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_AFTER);
    myObject.method5(...params);
  });

  test("Type - CONDITION_BEFORE", () => {
    subscribe(myObject, middleware, ObjectMiddlewareType.CONDITION_BEFORE);
    myObject.method5(...params);
  });

  test("Type - OVERRIDE", () => {
    subscribe(myObject, middleware, ObjectMiddlewareType.OVERRIDE);
    myObject.method5(...params);
  });
});

describe("Prototype", () => {
  test("All instances must be affected", () => {
    class TestClass {
      constructor(private num: number) {}
      testMethod(num: number) {
        return this.num * num;
      }
    }

    const testObject1 = new TestClass(4);
    const testObject2 = new TestClass(32);
    const testObject3 = new TestClass(128);

    const middleware: ObjectMiddlewareOverrideFunction<TestClass> = (
      ref: ObjectMiddlewareParams<TestClass>,
      num: number
    ) => {
      return ref.result * num;
    };

    subscribe(testObject1, middleware, ObjectMiddlewareType.OVERRIDE, [], true);

    expect(testObject1.testMethod(2)).toBe(16);
    expect(testObject2.testMethod(3)).toBe(288);
    expect(testObject3.testMethod(5)).toBe(3200);
  });

  test("Unsubscribe", () => {
    class TestClass {
      constructor(private num: number) {}
      testMethod(num: number) {
        return this.num * num;
      }
      method() {}
    }

    const testObject1 = new TestClass(1);
    const testObject2 = new TestClass(1);
    const methodsCount = getMethodsCount(testObject1);

    const middleware = () => {};

    subscribe(testObject1, middleware, ObjectMiddlewareType.AFTER, [], true);

    expect(testObject1[prototypeInitIndex].length).toBe(methodsCount);
    expect(testObject2[prototypeInitIndex].length).toBe(methodsCount);

    unsubscribeAll(testObject1, [], true);

    expect(testObject1[prototypeInitIndex].length).toBe(0);
    expect(testObject2[prototypeInitIndex].length).toBe(0);
  });

  test("Shouldn't affect instances", () => {
    class TestClass {
      constructor() {}
      testMethod() {
        return 0;
      }
    }

    const testObject1 = new TestClass();
    const testObject2 = new TestClass();
    const methodsCount = getMethodsCount(testObject1);

    const middleware1 = () => 15;
    const middleware2 = () => 20;

    subscribe(
      testObject1,
      middleware1,
      ObjectMiddlewareType.OVERRIDE,
      [],
      true
    );

    subscribe(testObject2, middleware2, ObjectMiddlewareType.OVERRIDE);

    expect(testObject1[prototypeInitIndex].length).toBe(methodsCount);
    expect(testObject1[instanceInitIndex]).toBe(undefined);
    expect(testObject2[prototypeInitIndex].length).toBe(methodsCount);
    expect(testObject2[instanceInitIndex].length).toBe(methodsCount);

    expect(testObject1.testMethod()).toBe(15);
    expect(testObject2.testMethod()).toBe(20);

    unsubscribe(testObject2, middleware2, ObjectMiddlewareType.OVERRIDE);

    expect(testObject1.testMethod()).toBe(15);
    expect(testObject2.testMethod()).toBe(15);

    unsubscribeAll(testObject2, [], true);

    expect(testObject1.testMethod()).toBe(0);
    expect(testObject2.testMethod()).toBe(0);
  });

  test("Overwriting prototype method", () => {
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

    testObject2.testMethod = function () {
      return 55;
    };

    subscribe(
      testObject1,
      middleware1,
      ObjectMiddlewareType.OVERRIDE,
      [],
      true
    );

    subscribe(testObject2, middleware2, ObjectMiddlewareType.OVERRIDE);

    expect(testObject1.testMethod()).toBe(15);
    expect(testObject2.testMethod()).toBe(20);

    unsubscribe(testObject2, middleware2, ObjectMiddlewareType.OVERRIDE);

    expect(testObject2.testMethod()).toBe(55);

    unsubscribeAll(testObject2, [], true);

    expect(testObject1.testMethod()).toBe(0);
    expect(testObject2.testMethod()).toBe(55);
  });

  test("Alter Subscribe", () => {
    class TestClass {
      constructor() {}
      testMethod(num: number) {
        return num;
      }
    }
    const testObject1 = new TestClass();
    const testObject2 = new TestClass();

    const middleware1: ObjectMiddlewareOverrideFunction<TestClass> = (
      _: ObjectMiddlewareParams<TestClass>,
      num: number
    ) => {
      return num * 2;
    };
    const middleware2: ObjectMiddlewareOverrideFunction<TestClass> = (
      _: ObjectMiddlewareParams<TestClass>,
      num: number
    ) => {
      return num * 3;
    };

    subscribe(
      testObject1,
      middleware1,
      ObjectMiddlewareType.OVERRIDE,
      [],
      true
    );

    expect(testObject1.testMethod(3)).toBe(6);
    expect(testObject2.testMethod(3)).toBe(6);

    subscribe(testObject2, middleware2, ObjectMiddlewareType.OVERRIDE);

    expect(testObject1.testMethod(3)).toBe(6);
    expect(testObject2.testMethod(3)).toBe(9);
  });
});

test("Simple object", () => {
  const testObject = {
    testMethod: function () {
      return 0;
    }
  };

  const middleware = () => {
    return 10;
  };

  subscribe(testObject, middleware, ObjectMiddlewareType.OVERRIDE);

  expect(testObject.testMethod()).toBe(10);

  unsubscribeAll(testObject);

  expect(testObject.testMethod()).toBe(0);

  subscribe(testObject, middleware, ObjectMiddlewareType.OVERRIDE, [], true);

  expect(testObject.testMethod()).toBe(10);

  unsubscribeAll(testObject, [], true);

  expect(testObject.testMethod()).toBe(0);
});
