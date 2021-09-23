import { defer } from "@/packages/utils/defer";
import { VisualEditorProps } from "@/packages/visual-editor-props";
import deepcopy from "deepcopy";
import { ElButton, ElDialog, ElInput, ElTable, ElTableColumn } from "element-plus";
import { createApp, defineComponent, getCurrentInstance, onMounted, PropType, reactive } from "vue";

export interface TableropditorServiceOption {
  data: any[],
  config: VisualEditorProps,
  onConfirm: (val: any[]) => void
}

const ServiceComponent = defineComponent({
  props: {
    option: {
      type: Object as PropType<TableropditorServiceOption>,
      required: true
    }
  },
  setup (props) {
    const vm = getCurrentInstance();
    const state = reactive({
      option: props.option,
      showFlag: false,
      mounted: (() => { // 解决首页页面加载，右键菜单没有动画的情况
        const dfd = defer();
        onMounted(() => setTimeout(dfd.resolve));
        return dfd.promise;
      })(),
      editData: [] as any[]
    });

    const methods = {
      service: (option: TableropditorServiceOption) => {
        state.option = option;
        state.editData = deepcopy(option.data);
        methods.show();
      },
      show: async () => {
        await state.mounted;
        state.showFlag = true;
      },
      hide: () => {
        state.showFlag = false;
      },
      add: () => {
        state.editData.push({});
      },
      reset: () => {
        state.editData = deepcopy(state.option.data);
      }
    };
    const handler = {
      onConfirm: () => {
        state.option.onConfirm(state.editData);
        methods.hide();
      },
      onCancel: () => {
        methods.hide();
      },
      onDelete: (index: number) => {
        state.editData.splice(index, 1);
      }
    }

    Object.assign(vm?.proxy, methods);
    // @ts-ignore
    return () => (<ElDialog v-model={state.showFlag}>
      {
        {
          default: () => (<div>
            <div class="header">
              <ElButton {...{onClick: methods.add} as any}>添加</ElButton>
              <ElButton {...{onClick: methods.reset} as any}>重置</ElButton>
            </div>

            <ElTable data={state.editData}>
              <ElTableColumn {...{type:"index"} as any}></ElTableColumn>
              {state.option.config.table?.options.map((item, idnex) => (
                 <ElTableColumn {...{label: item.label}}>
                   {
                     {
                       default: ({row}: {row: any}) => (<ElInput v-model={row[item.field]}/>),
                     }
                   }
                 </ElTableColumn>
              ))}
              <ElTableColumn {...{label: '操作'}}>
                {
                  {
                    default: ({$index}: {$index: number}) => (
                      <ElButton
                        type="danger"
                        {...{onClick: () => handler.onDelete($index)} as any}>
                        删除
                      </ElButton>
                    )
                  }
                }
              </ElTableColumn>
            </ElTable>
          
          </div>),
          footer: () => <>
            <ElButton {...{onClick: handler.onCancel} as any}>取消</ElButton>
            <ElButton type="primary" {...{onClick: handler.onConfirm}}>确定</ElButton>
          </>
        }
      }
    </ElDialog>);
  }
});

export const $$tablePropEditor = (() => {
  let ins: any;
  return (option: Omit<TableropditorServiceOption, 'onConfirm'>) => {
    if (!ins) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const app = createApp(ServiceComponent, { option });
      ins = app.mount(el);
    }
    const dfd = defer<any[]>();
    ins.service({
      ...option,
      onConfirm: dfd.resolve
    });
    return dfd.promise;
  };
})();