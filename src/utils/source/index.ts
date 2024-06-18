type Subscription = () => void;
type Subscriber<T> = (value: T) => void;
export interface Source<T> {
  getState(): T;
  next(value: T): void;
  subscribe(subscriber: Subscriber<T>): Subscription;
}

export const createSource = <T>(value: T): Source<T> => {
  let state = value;
  const subscriber = new Set<(value: T) => void>();

  return {
    getState() {
      return state;
    },
    next(value: T) {
      state = value;
      subscriber.forEach((callback) => callback(value));
    },
    subscribe(callback: (value: T) => void) {
      subscriber.add(callback);

      return () => {
        subscriber.delete(callback);
      };
    },
  };
};
