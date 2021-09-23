import deepcopy from "deepcopy";
import { useCommander } from './plugins/command.plugin';
import { VisualEditorBlockData, VisualEditorModelValue } from './visual-editors.utils';

export function useVisualCommand({
  focusData,
  updateBlocks,
  dataModel,
  dragstart,
  dragend
}: {
  focusData: {
    value: {
      focus: VisualEditorBlockData[],
      unFocus: VisualEditorBlockData[]
    }
  },
  updateBlocks: (blocks: VisualEditorBlockData[]) => void,
  dataModel: {
    value: VisualEditorModelValue
  },
  dragstart: { on: (cb: () => void) => void, off: (cb: () => void) => void },
  dragend: { on: (cb: () => void) => void, off: (cb: () => void) => void },
}) {
  const commander = useCommander();

  // 注册删除命令
  commander.registry({
    name: 'delete',
    keyboard: ['backspace', 'delete', 'ctrl+d'],
    execute: () => {
      const data = {
        before: dataModel.value.blocks || [],
        after: focusData.value.unFocus
      }
      return {
        redo: () => {
          // console.log('重新触发删除命令');
          updateBlocks(data.after)
        },
        undo: () => {
          // console.log('撤销了删除命令');
          updateBlocks(data.before)
        },
      }
    }
  })

  // 拖拽自动触发命令
  commander.registry({
    name: 'drag',
    init() {
      this.data = { before: null as null | VisualEditorBlockData[], }
      const handler = {
        dragstart: () => this.data.before = deepcopy(dataModel.value.blocks || []),
        dragend: () => commander.state.commands.drag()
      }
      dragstart.on(handler.dragstart)
      dragend.on(handler.dragend)
      return () => {
        dragstart.off(handler.dragstart)
        dragend.off(handler.dragend)
      }
    },
    execute() {
      const before = deepcopy(this.data.before);
      const after = deepcopy(dataModel.value.blocks || []);
      
      return {
        redo: () => {
          updateBlocks(deepcopy(after));
        },
        undo: () => {
          updateBlocks(deepcopy(before));
        },
      }
    }
  })
  commander.init(); // 拖拽的时候就出提前触发

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

  // 注册更新数据命令
  commander.registry({
    name: 'updateModelValue',
    execute: (val: VisualEditorModelValue) => {
      const data = {
        before: deepcopy(dataModel.value),
        after: deepcopy(val)
      };
      return {
        redo: () => {
          dataModel.value = data.after;
        },
        undo: () => {
          dataModel.value = data.before;
        }
      }
    }
  })

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

  return {
    undo: () => commander.state.commands.undo(),
    redo: () => commander.state.commands.redo(),
    delete: () => commander.state.commands.delete(),
    drag: () => commander.state.commands.drag(),
    clear: () => commander.state.commands.clear(),
    placeBottom: () => commander.state.commands.placeBottom(),
    placeTop: () => commander.state.commands.placeTop(),
    updateBlock: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => commander.state.commands.updateBlock(newBlock, oldBlock),
    updateModelValue: (val: VisualEditorModelValue) => commander.state.commands.updateModelValue(val)
  }
}