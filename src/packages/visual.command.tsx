import deepcopy from 'deepcopy';
import { useCommander } from './plugins/command.plugin';
import { VisualEditorBlockData, VisualEditorModelValue } from './visual-editor.utils';

export function useVisualCommand({
    focusData,
    dataModel,
    updateBlocks,
    event
}: {
    focusData: {
        value: {
            focus: VisualEditorBlockData[],
            unFocus: VisualEditorBlockData[]
        }
    },
    dataModel: {
        value: VisualEditorModelValue
    },
    updateBlocks: (blocks: VisualEditorBlockData[]) => void,
    event: {
        on: {
            dragstart: (cb: () => void) => void,
            dragend: (cb: () => void) => void,
        },
        off: {
            dragstart: (cb: () => void) => void,
            dragend: (cb: () => void) => void,
        }
    }
}) {
    const commander = useCommander();


    // 注册删除命令
    commander.registry({
        name: 'delete',
        keyboard: ['backspace', 'delete', 'ctrl+d'],
        execute: () => {
            const data = {
                // 这里还可以有有优化空间,后面再解决
                before: dataModel.value.blocks || [],
                after: focusData.value.unFocus
            }
            console.log('删除命令');
            return {
                redo: () => {
                    console.log('触发删除命令');
                    updateBlocks(data.after); // 删除的就是选中的,剩下的就是未选中的
                },
                undo: () => {
                    console.log('撤销了删除命令');
                    updateBlocks(data.before); // 恢复已经删除的,就是原有的数据
                }
            }
        }
    });

    // 注册清除
    commander.registry({
        name: 'clear',
        execute: () => {
            const data = {
                before: deepcopy(dataModel.value.blocks || []),
                after: deepcopy([])
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                }
            }
        }
    });

    // 注册组件添加的画布容器命令
    // 拖拽自动触发命令(通过发布订阅实现)
    /**
     * 拖拽命令，适用于三种情况：
     * - 从菜单拖拽组件到容器画布；
     * - 在容器中拖拽组件调整位置;
     * - 拖拽调整组件的宽度和高度.
     */
    commander.registry({
        name: 'drag', // 拖拽添加
        init() {
            this.data = {
                before: null as null | VisualEditorBlockData[]
            };
            const handler = {
                dragstart: () => this.data.before = deepcopy(dataModel.value.blocks || []),
                dragend: () => commander.state.commands.drag()
            }
            // 初始化时候监听拖拽事件
            event.on.dragstart(handler.dragstart);
            event.on.dragend(handler.dragend);

            // 返回一个函数,是为了做一些组件销毁的一些操作
            return () => {
                event.off.dragstart(handler.dragstart);
                event.off.dragend(handler.dragend);
            }
        },
        execute() {
            const data = {
                before: deepcopy(this.data.before),
                after: deepcopy(dataModel.value.blocks || [])
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        }
    })
    /*初始化命令以及事件*/
    commander.init(); // 自动触发 init


    // Ctrl + a 全选命令注册
    commander.registry({
        name: 'selectAll',
        followQueue: false, // 不需要存放到命令队列
        keyboard: 'ctrl+a',
        execute: () => {
            return {
                redo: () => {
                    (dataModel.value.blocks || []).forEach(block => block.focus = true);
                },
                undo: () => {
                    return;
                }
            }
        }
    })

    // 注册置顶命令
    commander.registry({
        name: 'placeTop',
        keyboard: 'ctrl+up',
        execute: () => {
            const data = {
                before: deepcopy(dataModel.value.blocks || []),
                after: deepcopy((() => {
                    const { focus, unFocus } = focusData.value;
                    const maxZIndex = unFocus.reduce((prev, block) => Math.max(prev, block.zIndex), -Infinity) + 1;
                    focus.forEach(block => block.zIndex = maxZIndex);
                    return deepcopy(dataModel.value.blocks || []);
                })()),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        }
    })

    // 注册置底命令
    commander.registry({
        name: 'placeBottom',
        keyboard: 'ctrl+down',
        execute: () => {
            const data = {
                before: deepcopy(dataModel.value.blocks || []),
                after: deepcopy((() => {
                    const { focus, unFocus } = focusData.value;
                    let minZIndex = unFocus.reduce((prev, block) => Math.min(prev, block.zIndex), Infinity) - 1;
                    if (minZIndex < 0) {
                        const dur = Math.abs(minZIndex);
                        unFocus.forEach(block => block.zIndex += dur);
                        minZIndex = 0;
                    }
                    focus.forEach(block => block.zIndex = minZIndex);
                    return deepcopy(dataModel.value.blocks || []);
                })()),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        }
    })

    // 注册编辑命令
    commander.registry({
        name: 'updateBlock',
        execute: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => {
            const blocks = deepcopy(dataModel.value.blocks || []);
            const data = {
                before: blocks,
                after: (() => {
                    const index = (dataModel.value.blocks || []).indexOf(oldBlock);
                    if (index > -1) {
                        blocks.splice(index, 1, newBlock);
                    }
                    return deepcopy(blocks);
                })()
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after));
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before));
                },
            }
        }
    })

    return {
        undo: () => {
            // console.log('undo');
            commander.state.commands.undo();
        },
        redo: () => {
            // console.log('redo');
            commander.state.commands.redo();
        },
        delete: () => {
            // console.log('delete');
            commander.state.commands.delete();
        },
        clear: () => {
            // console.log('clear');
            commander.state.commands.clear();
        },
        placeTop: () => {
            // console.log('placeTop');
            commander.state.commands.placeTop();
        },
        placeBottom: () => {
            // console.log('placeBottom');
            commander.state.commands.placeBottom();
        },
        updateBlock: () => {
            console.log('updateBlock');
        }
    }
}