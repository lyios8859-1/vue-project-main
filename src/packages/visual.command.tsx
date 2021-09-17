import { useCommander } from './plugins/command.plugin';

export function useVisualCommand () {
    const commander = useCommander();


     // 注册删除命令
    commander.registry({
        name: 'delete',
        keyboard: ['backspace', 'delete', 'ctrl+d'],
        execute: () => {
            const data = {
                before: [],
                after: []
            }
            console.log('删除命令');
            return {
                redo: () => {
                    console.log('触发删除命令');
                },
                undo: () => {
                    console.log('撤销了删除命令');
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