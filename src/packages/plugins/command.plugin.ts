import { reactive, onUnmounted } from "vue";

import { KeyboardCode } from './keyboard-code';

export interface CommandExecute {
    undo?: () => void; // 撤销, 将做的事情还原,将此次做的事情回归到上一次的操作
    redo: () => void; // 重做, 重新做一遍要做的事情,将此次做的事情回到上一次重新操作
}

export interface Command {
    name: string; // 命令唯一标识符
    keyboard?: string | string[]; // 命令监听的快捷键
    execute: (...args: any[]) => CommandExecute; // 命令执行的函数
    followQueue?: boolean; // 命令执行完后, 是否需要将执行得到的 undo 和 redo 存入命令队列 (queue).
    init?: () => (() => void) | undefined; // 命令初始化函数
    destroy?: () => void; // 组件销毁时的一些清除操作函数
    data?: any; // 命令缓存的数据
}

export function useCommander() {
    // 设置为响应式,是有些命令是有状态变化的,比如撤回到最后一个就不可再点击,删除完就不可在点击
    const state = reactive({
        current: -1, // 记录当前命令队列的索引, 重做会 +1, 撤销会 -1
        queue: [] as CommandExecute[], // 存放操作的命令容器队列
        commands: {} as Record<string, (...args: any[]) => void>, // Command 的 name 的映射
        registerCommands: [] as Command[], // 保存注册时所有的命令对象数组容器
        destroyList: [] as ((() => void) | undefined)[], // 组件销毁的时候，需要调用的销毁逻辑数组容器, 比如初始化的时候拖拽事件的监听,销毁时,需要移除的
    })

    // 注册各个命令操作
    const registry = (command: Command) => {

        // 添加命令信息
        state.registerCommands.push(command);

        state.commands[command.name] = (...args) => {
            // console.log('执行最终的 executer', state.queue)
            const { undo, redo } = command.execute(...args);
            redo();
            // 如果命令执行之后，不需要进入命令队列，则直接结束
            if (command.followQueue === false) return;
            // 否则，将命令队列中剩余的命令去除，保留 current 及其之前的命令
            let { queue } = state;
            const { current } = state;
            if (queue.length > 0) { // 这里的操作保证撤销和重做,添加,删除都和在编辑器中操作是一致的
                queue = queue.slice(0, current + 1);
                state.queue = queue;
            }
            // 设置命令队列中最后一个命令为当前执行的命令
            queue.push({ undo, redo }); // 添加到命令队列
            // 索引 +1，指向队列中的最后一个命令
            state.current = current + 1;
        };
    }

      //#region 默认注册有两个命令:撤销和重做
    // 默认注册撤销命令
    registry({
        name: "undo", // undo 在 execut 的 redo 里执行 undo, 要注意
        keyboard: "ctrl+z",
        followQueue: false, // 不需要放入命令队列 queue 里面
        execute: () => {
        // 命令执行是执行的函数,做点啥
        return {
            redo: () => {
                if (state.current === -1) return;

                const queueCommands = state.queue[state.current];
                if (!!queueCommands) {
                    queueCommands.undo && queueCommands.undo();
                    state.current--;
                }
            },
        };
        },
    });

    // 默认注册重做命令
    registry({
        name: "redo", // redo 在 execut 的 redo 里执行 redo, 要注意
        followQueue: false, // 不需要放入命令队列 queue 里面
        keyboard: ["ctrl+y", "ctrl+shift+z"],
        execute: () => {
            return {
                redo: () => {
                    const queueCommands = state.queue[state.current + 1];
                    if (!!queueCommands) {
                        queueCommands.redo && queueCommands.redo();
                        state.current++;
                    }
                },
            };
        },
    });
    //#endregion

    const keyboardEvent = (() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // console.log(document.activeElement ,document.body);
            
            // fix 快捷键和浏览器的事件冲突
            if (document.activeElement !== document.body) return;
            const { shiftKey, ctrlKey, altKey, keyCode, metaKey } = e;
            const keyString: string[] = []; // 生成快捷组合鍵容器
            if (ctrlKey || metaKey) keyString.push('ctrl');
            if (shiftKey) keyString.push('shift');
            if (altKey) keyString.push('alt');

            keyString.push(KeyboardCode[keyCode]);
            const keyNames = keyString.join('+');

            state.registerCommands.forEach(({keyboard, name}) => {
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

    // 有些命令注册时需要一些初始化操作,比如初始化监听的拖拽 dragstart dragend 事件
    const init = () => {
        // 执行命令注册时的初始化, init 函数, 比如拖拽添加时的操作,需要对
        state.registerCommands.forEach(command => {
            command.init && state.destroyList.push(command.init());
        });
        state.destroyList.push(keyboardEvent());
    };

    onUnmounted(() => state.destroyList.forEach(fn => fn && fn()));
    return {
        registry,
        state,
        init
    }
}