export type SimpleFunction = (...args: any[]) => any;

type Listener = (SimpleFunction & { fn?: any });
type ListenName = string | symbol;
export type PlainEvent = ReturnType<typeof usePlainEvent>;

export function usePlainEvent<Option extends { [k: string]: (...args: any[]) => void }>(option: Option): {
  on: { [k in keyof Option]: (cb: Option[k]) => void },
  once: { [k in keyof Option]: (cb: Option[k]) => void },
  off: { [k in keyof Option]: (cb: Option[k]) => void },
  emit: { [k in keyof Option]: (...args: Parameters<Option[k]>) => void },
} {
  // 首次调用 getEvents 时才创建 map 对象
  const getListMap = (() => {
    let events: Map<ListenName, Listener[]>;
    return () => {
      if (!events) {
        events = new Map<ListenName, Listener[]>();
      }
      return events;
    }
  })();

  const event = {
    on: {},
    once: {},
    off: {},
    emit: {}
  } as any;
  
  let hasListener = false;
  Object.entries(option).forEach(([eventName, handler]) => {
    event.on[eventName] = (callback: SimpleFunction) => {
      hasListener = true;
      const map = getListMap();
      const list = map.get(eventName);
      !!list ? list.push(callback) : map.set(eventName, [callback]);
    };

    // 触发一次
    event.once[eventName] = (callback: SimpleFunction) => {
      hasListener = true;

      // tempFn 执行时会传入参数
      const tempFn = (...args: any) => {
        callback(...args); // 将 once 绑定的函数执行
        event.off[eventName](tempFn); // 当 tempFn 触发后立即移除
      }
      tempFn.fn = callback; // 绑定的到 tempFn, 防止删除无法删除, 增加自定义属性,删除是判断一下
      event.on[eventName](tempFn); // 这监听了了 tempFn 函数, 目的为了方便移除
    };

    event.emit[eventName] = (...args: any[]) => {
      handler(...args);
      const  listeners = getListMap().get(eventName);
      if (!!listeners) {
        listeners.forEach(listener => listener(...args));
      }
    };

    // 移除监听
    event.off[eventName] = (callback: SimpleFunction) => {
      const listenMap = getListMap();
      const listeners = listenMap.get(eventName);
      if (!listeners) return;
      if (!callback) {
        return listenMap.set(eventName, []); // 移除所有的事件监听
      }

      for (let i = 0; i < listeners.length; i++) {
        const lintener = listeners[i];
        if (callback === lintener || (!!lintener.fn && callback === lintener.fn)) {
          // 删除指定的事件监听
          listeners.splice(i, 1);
          break;
        }
      }
    };
  })

  // 清除 map 中的事件
  const clearMap = () => {
    if (hasListener) {
      getListMap().clear();
      hasListener = false;
    }
  }

  // 手动调用
  event.clearMap = clearMap;

  // 交给 vue 卸载时自动清除
  // onBeforeUnmount(() => hasListener && clearMap());
  return event;
}

/*
实例:

const plainEvent = usePlainEvent({
  buy: v => v,
  send: v => v
})

const buyPack = (who: string) => console.log(who + '买包包');
const buyCar = (who: string) => console.log(who + '买豪车');

// 注册事件监听
plainEvent.on.buy(buyPack);
plainEvent.on.buy(buyCar);
// 触发已经注册的监听事件
plainEvent.emit.buy('给心仪的女孩');

// 注册事件监听
plainEvent.on.buy(buyPack);
plainEvent.on.buy(buyCar);
plainEvent.off.buy(buyCar)
// 触发已经注册的监听事件
plainEvent.emit.buy('给心仪的女孩');

// 注册事件监听
plainEvent.on.buy(buyPack);
// 触发已经注册的监听事件
plainEvent.emit.buy('给心仪的女孩');
plainEvent.emit.buy('给心仪的女孩');

// 注册事件监听
plainEvent.once.buy(buyPack);
// 触发已经注册的监听事件
plainEvent.emit.buy('给心仪的女孩');
plainEvent.emit.buy('给心仪的女孩');
*/

// 简单版发布订阅
type simplyListener = () => void;

export function usePlainEventSimple() {
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
