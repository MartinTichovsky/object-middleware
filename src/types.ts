// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyType = any;

export type FunctionType = (...args: AnyType[]) => AnyType;

export enum ObjectMiddlewareType {
    AFTER,
    BEFORE,
    CONDITION_AFTER,
    CONDITION_BEFORE,
    OVERRIDE
}

export type ObjectMiddlewareAssignParams<T> = {
    key: string;
    newMethod: FunctionType;
    object: T;
    originDefinedInPrototype?: boolean;
    originMethod: FunctionType;
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

export type ObjectMiddlewareInitType<T, Method extends FunctionType = FunctionType> = [
    key: string,
    middleware: ObjectMiddlewareFunctionType<T, Method>,
    type: ObjectMiddlewareType
];

export type ObjectMiddlewareFunction<T, Method extends FunctionType = FunctionType> = (
    ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
    ...args: Parameters<Method>
) => ReturnType<Method>;
export type ObjectMiddlewareFunctionBoolean<T, Method extends FunctionType = FunctionType> = (
    ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
    ...args: Parameters<Method>
) => boolean;
export type ObjectMiddlewareFunctionVoid<T, Method extends FunctionType = FunctionType> = (
    ref: ObjectMiddlewareParams<T, ReturnType<Method>>,
    ...args: Parameters<Method>
) => void;
export type ObjectMiddlewareFunctionType<T, Method extends FunctionType = FunctionType> =
    | ObjectMiddlewareFunctionVoid<T, Method>
    | ObjectMiddlewareFunctionBoolean<T, Method>
    | ObjectMiddlewareFunction<T, Method>;

export type ObjectMiddlewareFunctionTypes<T, Method extends FunctionType = FunctionType> = {
    [ObjectMiddlewareType.AFTER]: ObjectMiddlewareFunctionVoid<T, Method>;
    [ObjectMiddlewareType.CONDITION_AFTER]: ObjectMiddlewareFunctionBoolean<T, Method>;
    [ObjectMiddlewareType.BEFORE]: ObjectMiddlewareFunctionVoid<T, Method>;
    [ObjectMiddlewareType.CONDITION_BEFORE]: ObjectMiddlewareFunctionBoolean<T, Method>;
    [ObjectMiddlewareType.OVERRIDE]: ObjectMiddlewareFunction<T, Method>;
};

export type ObjectMiddlewareOriginType = [
    key: string,
    originMethod: FunctionType,
    originDefinedInPrototype: boolean
];

export type ObjectMiddlewareDeleteOriginProps<T, Index> = {
    key: string;
    newMethod: FunctionType;
    object: T;
    originIndex: Index;
    originMethod: FunctionType;
};

export type ObjectMiddlewareDeleteProps<T> = {
    key: string;
    middleware: ObjectMiddlewareFunctionType<T>;
    resource: ObjectMiddlewareInitType<T>[];
    type: ObjectMiddlewareType;
};

export type ObjectMiddlewareMethodProps<T> = {
    currentMethod: FunctionType;
    key: string;
    middleware: ObjectMiddlewareFunctionType<T>;
    type: ObjectMiddlewareType;
};

export type ObjectMiddlewareRecreateProps<T> = {
    key: string;
    originMethod: FunctionType;
    resource: ObjectMiddlewareInitType<T>[];
};

export type ObjectMiddlewareSaveOrigin<T, Index> = {
    key: string;
    object: T;
    originDefinedInPrototype: boolean;
    originIndex: Index;
    originMethod: FunctionType;
};
