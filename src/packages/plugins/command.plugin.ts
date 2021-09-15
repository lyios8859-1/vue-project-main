import { reactive, onUnmounted } from 'vue';
import { KeyboardCode } from './keyboard-code';

export interface CommandExecute {
  undo: () => void,
  redo: () => void
}

export interface Command {
  name: string,  // 命令唯一标识符
  keyboard?: string | string[], // 命令监听的快捷键
  execute: (...args: any[]) => CommandExecute, // 命令执行的函数
  followQueue?: boolean // 命令执行后, 是否需要执行得到的 undo 和 redo 存入队列
  init?: () => ((() => void) | undefined),   // 命令初始化函数
  data?: any
}

export interface CommandManager {
  queue: CommandExecute[],
  current: number
}

export function useCommander () {
  const state = reactive({
    current: -1,
    queue: [] as CommandExecute[],
    commandArray: [] as Command[],
    commands: {} as Record<string, (...args: any[]) => void>,
    destroyList: [] as ((() => void) | undefined)[],
  });
  const registry = (command: Command) => {
    // 添加命令信息
    state.commandArray.push(command);

    state.commands[command.name] = (...args) => {
      // const { undo, redo } = command.execute(...args);
      // if (command.followQueue !== false) {
      //   // 设置命令队列中最后一个命令为当前执行的命令
      //   state.queue.push({ undo, redo })
      //   // 索引+1，指向队列中的最后一个命令
      //   state.current += 1;
      // }
      // redo();


      const { undo, redo } = command.execute(...args);
      redo();
      // 如果命令执行之后，不需要进入命令队列，则直接结束
      if (command.followQueue === false) return;
      // 否则，将命令队列中剩余的命令去除，保留current及其之前的命令
      let { queue } = state;
      const { current } = state;
      if (queue.length > 0) { // 这里的操作保证撤销和重做,添加,删除都和在编辑器中操作是一致的
        queue = queue.slice(0, current + 1)
        state.queue = queue
      }
      // 设置命令队列中最后一个命令为当前执行的命令
      queue.push({ undo, redo })
      // 索引+1，指向队列中的最后一个命令
      state.current = current + 1;
    }
  };

  const keyboardEvent = (() => {
    const onKeyDown = (e: KeyboardEvent) => {
      console.log(document.activeElement ,document.body);
      
      if (document.activeElement !== document.body) return;
      const { shiftKey, ctrlKey, altKey, keyCode, metaKey } = e;
      const keyString: string[] = []; // 生成快捷组合鍵容器
      if (ctrlKey || metaKey) keyString.push('ctrl');
      if (shiftKey) keyString.push('shift');
      if (altKey) keyString.push('alt');
      keyString.push(KeyboardCode[keyCode]);
      const keyNames = keyString.join('+');
      state.commandArray.forEach(({keyboard, name}) => {
        if (!keyboard) return;
        const keys = Array.isArray(keyboard) ? keyboard : [keyboard];
        if(keys.indexOf(keyNames) > -1){
          state.commands[name](); // 执行对应的命令
          e.stopPropagation();
          e.preventDefault();
        }
      })
    }
    const initEvent = () => {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
    return initEvent;
  })();

  const init = () => {
    // const onKeydown = (e: KeyboardEvent) => {
    //   console.log('监听到键盘时间', e)
    // }
    state.commandArray.forEach(command => command.init && state.destroyList.push(command.init()));
    state.destroyList.push(keyboardEvent());
    // state.destroyList.push(() => window.removeEventListener('keydown', onKeydown))
  };

  // 默认注册两个快捷键命令
  registry({
    name: 'undo',  // 撤销
    keyboard: 'ctrl+z',
    followQueue: false,
    execute: () => {
      // 快捷键执行时,做点事情
      return {
        undo: () => {
          // 将正在做的事还原
        },
        redo: () => {
          // 重新做一次,正在做的事
          if (state.current === -1) {
            return;
          }
          const queueItem = state.queue[state.current];
          if (queueItem) {
            queueItem.undo && queueItem.undo();
            state.current--;
          }
        }
      }
    }
  });
  registry({
    name: 'redo', // 重做
    followQueue: false,
    keyboard: [
      'ctrl+y',
      'ctrl+shift+z'
    ],
    execute: () => {
      // 快捷键执行时,做点事情
      return {
        undo: () => {
          // 将正在做的事还原
          console.log('将正在做的事还原')
        },
        redo: () => {
          // 重新做一次,正在做的事
          const queueItem = state.queue[state.current + 1];
          if (!!queueItem) {
            queueItem.redo && queueItem.redo();
            state.current++;
          }
        }
      }
    }
  });

  onUnmounted(() => state.destroyList.forEach(fn => fn && fn()));
  return {
    state,
    registry,
    init
  }
}