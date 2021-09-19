import { useCommander } from './plugins/command.plugin';
import { VisualEditorBlockData, VisualEditorModelValue } from './visual-editor.utils';

export function useVisualCommand ({
    focusData,
    dataModel,
    updataBlocks
} : {
    focusData: {
        value: {
            focus: VisualEditorBlockData[],
            unFocus: VisualEditorBlockData[]
        }
    },
    dataModel: {
        value: VisualEditorModelValue
    },
    updataBlocks: (blocks: VisualEditorBlockData[]) => void,
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
            console.log('删除命令');
            return {
                redo: () => {
                    console.log('触发删除命令');
                    updataBlocks(data.after);
                },
                undo: () => {
                    console.log('撤销了删除命令');
                    updataBlocks(data.before);
                }
            }
        }
    })


    return {
        undo: () => {
            console.log('undo');
            commander.state.commands.undo();
        },
        redo: () => {
            console.log('redo');
            commander.state.commands.redo();
        },
        delete: () => {
            console.log('delete');
            commander.state.commands.delete();
        },
    }
}