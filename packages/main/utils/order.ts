export default function orderBy(
  value: any | any[],
  expression?: any,
  reverse?: boolean,
  isCaseInsensitive = false,
  comparator?: Function,
): any {
  if (!value) {
    return value;
  }

  if (Array.isArray(expression)) {
    return multiExpressionTransform(
      value,
      expression.slice(),
      reverse,
      isCaseInsensitive,
      comparator,
    );
  }

  if (Array.isArray(value)) {
    return sortArray(
      value.slice(),
      expression,
      reverse,
      isCaseInsensitive,
      comparator,
    );
  }

  if (typeof value === 'object') {
    return transformObject(
      { ...value },
      expression,
      reverse,
      isCaseInsensitive,
    );
  }

  return value;
}

const multiExpressionTransform = (
  value: any,
  expressions: any[],
  reverse?: boolean,
  isCaseInsensitive = false,
  comparator?: Function,
): any =>
  expressions
    .reverse()
    .reduce(
      (result: any, expression: any) =>
        orderBy(result, expression, reverse, isCaseInsensitive, comparator),
      value,
    );

const sortArray = (
  array: any,
  expression?: any,
  reverse?: boolean,
  isCaseInsensitive?: boolean,
  comparator?: Function,
): any => {
  const isDeepLink = expression && expression.indexOf('.') !== -1;

  if (isDeepLink) {
    expression = parseExpression(expression);
  }

  let compareFn: Function;

  if (comparator && typeof comparator === 'function') {
    compareFn = comparator;
  } else {
    compareFn = isCaseInsensitive ? caseInsensitiveSort : defaultCompare;
  }

  const sortedArray: any[] = array.sort((a: any, b: any): number => {
    if (!expression) {
      return compareFn(a, b);
    }

    if (!isDeepLink) {
      if (a && b) {
        return compareFn(a[expression], b[expression]);
      }
      return compareFn(a, b);
    }

    return compareFn(getValue(a, expression), getValue(b, expression));
  });

  if (reverse) {
    return sortedArray.reverse();
  }

  return sortedArray;
};

const parseExpression = (expression: string): string[] => {
  expression = expression.replace(/\[(\w+)\]/g, '.$1');
  expression = expression.replace(/^\./, '');
  return expression.split('.');
};

const getValue = (object: any, expression: string[]) => {
  for (let i = 0, n = expression.length; i < n; ++i) {
    if (!object) {
      return;
    }
    const k = expression[i];
    if (!(k in object)) {
      return;
    }
    if (typeof object[k] === 'function') {
      object = object[k]();
    } else {
      object = object[k];
    }
  }

  return object;
};

const caseInsensitiveSort = (a: any, b: any) => {
  if (isString(a) && isString(b)) {
    return a.localeCompare(b);
  }
  return defaultCompare(a, b);
};

const isString = (value: any): boolean =>
  typeof value === 'string' || value instanceof String;

const defaultCompare = (a: any, b: any) => {
  if (a && a instanceof Date) {
    a = a.getTime();
  }
  if (b && b instanceof Date) {
    b = b.getTime();
  }

  if (a === b) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  return a > b ? 1 : -1;
};

const transformObject = (
  value: any | any[],
  expression?: any,
  reverse?: boolean,
  isCaseInsensitive?: boolean,
): any => {
  const parsedExpression = parseExpression(expression);
  let lastPredicate = parsedExpression.pop() || null;
  let oldValue = getValue(value, parsedExpression);

  if (!Array.isArray(oldValue)) {
    parsedExpression.push(lastPredicate!);
    lastPredicate = null;
    oldValue = getValue(value, parsedExpression);
  }

  if (!oldValue) {
    return value;
  }

  setValue(
    value,
    orderBy(oldValue, lastPredicate, reverse, isCaseInsensitive),
    parsedExpression,
  );
  return value;
};

const setValue = (object: any, value: any, expression: string[]) => {
  let i;
  for (i = 0; i < expression.length - 1; i++) {
    object = object[expression[i]];
  }

  object[expression[i]] = value;
};
