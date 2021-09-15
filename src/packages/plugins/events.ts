// 简单版发布订阅
type simplyListener = () => void;

export function usePlainEvent() {
  const listeners: simplyListener[] = [];
  return {
    on: (cb: simplyListener) => {
      listeners.push(cb);
    },
    off: (cb: simplyListener) => {
      const index = listeners.indexOf(cb);
      if (index > -1) listeners.splice(index, 1);
    },
    emit: () => {
      listeners.forEach(item => item());
    }
  }
}
