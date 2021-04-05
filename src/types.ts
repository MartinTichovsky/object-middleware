export type AnyType = any;

export type Function = (...args: AnyType[]) => AnyType;

export enum ObjectMiddlewareType {
  AFTER,
  BEFORE,
  CONDITION_AFTER,
  CONDITION_BEFORE,
  OVERRIDE
}

export type ObjectMiddlewareAssignParams<T> = {
  key: string;
  newMethod: Function;
  object: T;
  originDefinedInPrototype?: boolean;
  originMethod: Function;
  prototype: T;
};

export type ObjectMiddlewareContinueParams<T, Index> = {
  initIndex: Index;
  key: string;
  object: T;
  methodName: string | string[];
};

export type ObjectMiddlewareParams<T, R = AnyType> = {
  methodName: string;
  ref: T;
  result?: R;
};

export type ObjectMiddlewareInitType<T, Method extends Function = Function> = [
  key: string,
  middleware: ObjectMiddlewareFunctionType<T, Method>,
  type: ObjectMiddlewareType
];

export type ObjectMiddlewareFunction<T, Method extends Function = Function> = (
  ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
  ...args: Parameters<Method>
) => ReturnType<Method>;
export type ObjectMiddlewareFunctionBoolean<
  T,
  Method extends Function = Function
> = (
  ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
  ...args: Parameters<Method>
) => boolean;
export type ObjectMiddlewareFunctionVoid<
  T,
  Method extends Function = Function
> = (
  ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
  ...args: Parameters<Method>
) => void;
export type ObjectMiddlewareFunctionType<
  T,
  Method extends Function = Function
> =
  | ObjectMiddlewareFunctionVoid<T, Method>
  | ObjectMiddlewareFunctionBoolean<T, Method>
  | ObjectMiddlewareFunction<T, Method>;

export type ObjectMiddlewareFunctionTypes<
  T,
  Method extends Function = Function
> = {
  [ObjectMiddlewareType.AFTER]: ObjectMiddlewareFunctionVoid<T, Method>;
  [ObjectMiddlewareType.CONDITION_AFTER]: ObjectMiddlewareFunctionBoolean<
    T,
    Method
  >;
  [ObjectMiddlewareType.BEFORE]: ObjectMiddlewareFunctionVoid<T, Method>;
  [ObjectMiddlewareType.CONDITION_BEFORE]: ObjectMiddlewareFunctionBoolean<
    T,
    Method
  >;
  [ObjectMiddlewareType.OVERRIDE]: ObjectMiddlewareFunction<T, Method>;
};

export type ObjectMiddlewareOriginType = [
  key: string,
  originMethod: Function,
  originDefinedInPrototype: boolean
];

export type ObjectMiddlewareDeleteOriginProps<T, Index> = {
  key: string;
  newMethod: Function;
  object: T;
  originIndex: Index;
  originMethod: Function;
};

export type ObjectMiddlewareDeleteProps<T> = {
  key: string;
  middleware: ObjectMiddlewareFunctionType<T>;
  resource: ObjectMiddlewareInitType<T>[];
  type: ObjectMiddlewareType;
};

export type ObjectMiddlewareMethodProps<T> = {
  currentMethod: Function;
  key: string;
  middleware: ObjectMiddlewareFunctionType<T>;
  type: ObjectMiddlewareType;
};

export type ObjectMiddlewareRecreateProps<T> = {
  key: string;
  originMethod: Function;
  resource: ObjectMiddlewareInitType<T>[];
};

export type ObjectMiddlewareSaveOrigin<T, Index> = {
  key: string;
  object: T;
  originDefinedInPrototype: boolean;
  originIndex: Index;
  originMethod: Function;
};
