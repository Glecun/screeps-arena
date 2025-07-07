export function action<T>(
  action: () => T | { error: number },
  errorBehaviors?: Map<number, () => void>
): T | { error: number } {
  const result = action();
  const error = (result as any)?.error ?? result;
  
  if (error >= 0) {
    return result;
  }

  if (!errorBehaviors || ![...errorBehaviors.keys()].includes(error)) {
    const err = new Error(error.toString());
    console.log(err.stack);
    return result;
  }
  
  errorBehaviors.get(error)?.();
  return result;
} 