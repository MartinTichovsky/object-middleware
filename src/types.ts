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

export type ObjectMiddlewareParams<T, R = any> = {
  methodName: string;
  ref: T;
  result?: R;
};

export type ObjectMiddlewareFunctionVoid<T> = (
  ref: ObjectMiddlewareParams<T>,
  ...args: any[]
) => void;
export type ObjectMiddlewareFunctionBoolean<T> = (
  ref: ObjectMiddlewareParams<T>,
  ...args: any[]
) => boolean;
export type ObjectMiddlewareOverrideFunction<T> = (
  ref: ObjectMiddlewareParams<T>,
  ...args: any[]
) => unknown;
export type ObjectMiddlewareFunctionType<T> =
  | ObjectMiddlewareFunctionVoid<T>
  | ObjectMiddlewareFunctionBoolean<T>
  | ObjectMiddlewareOverrideFunction<T>;

export type ObjectMiddlewareInitType<T> = [
  key: string,
  middleware: ObjectMiddlewareFunctionType<T>,
  type: ObjectMiddlewareType
];

export type ObjectMiddlewareOriginType = [key: string, originMethod: Function, originDefinedInPrototype: boolean];

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
