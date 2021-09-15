import { ElButton, ElColorPicker, ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElSelect } from 'element-plus';
import { defineComponent, PropType, reactive, watch } from 'vue';
import { VisualEditorProps, VisualEditorPropsType } from './visual-editor-props';
import { VisualEditorBlockData, VisualEditorConfig, VisualEditorModelValue } from './visual-editors.utils';
import deepcopy from "deepcopy";
import { TablePropEditor } from './components/table-prop-editor/table-prop-editor';

export const VisualEditorOperator = defineComponent({
  name: 'VisualEditorOperator',
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    dataModel: {
      type: Object as PropType<{value: VisualEditorModelValue}>,
      required: true
    },
    updateBlock: {
      type: Function as PropType<(newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => void>,
      required: true
    },
    updateModelValue: {
      type: Function as PropType<(val: VisualEditorModelValue) => void>,
      required: true
    }
  },
  setup(props) {
    const state = reactive({
      editData: '' as any
    });
    const methods = {
      apply: () => {
        if (!props.block) {
          // 当前编辑容器属性
          props.updateModelValue({
            ...props.dataModel.value,
            container: state.editData
          });
        } else {
          // 当前编辑 block 数据的属性
          // props.updateBlock({
          //   ...props.block,
          //   props: state.editData
          // }, props.block);
          props.updateBlock(state.editData, props.block);

        }
      },
      reset: () => {
        if (!props.block) {
          state.editData = deepcopy(props.dataModel.value.container);
        } else {
          // state.editData = deepcopy(props.block.props || {});
          state.editData = deepcopy(props.block);
        }
      }
    };
    watch(() => props.block, () => {
      methods.reset();
    }, {immediate: true}); // immediate: true 组件一渲染就执行

    const renderEditor = (propName: string, propConfig: VisualEditorProps) => {
      const com = {
        [VisualEditorPropsType.input]: () => (<ElInput v-model={state.editData.props[propName]}/>),
        [VisualEditorPropsType.color]: () => (<ElColorPicker v-model={state.editData.props[propName]}/>),
        [VisualEditorPropsType.select]: () => (<ElSelect v-model={state.editData.props[propName]}>
          {
            propConfig.options?.map(opt => (
              <ElOption label={opt.label} value={opt.val}></ElOption>
            ))
          }
        </ElSelect>),
        [VisualEditorPropsType.table]: () => (
          <TablePropEditor
            v-model={state.editData.props[propName]}
            propConfig={propConfig}/>
        )
      }[propConfig.type]();
      return com;
    };

    return () => {
      const content: JSX.Element[] = [];
      
      if (!props.block) {
        content.push((<>
          <ElFormItem label="容器宽度">
            {/* <ElInputNumber {...{modelValue: 1}} /> 不识别 modelValue 才这样写的 */} 
            {/* <ElInputNumber {...{modelValue: state.editData.width}} {...{step: '100'} as any}/> */}
            <ElInputNumber v-model={state.editData.width} {...{step: '100'} as any}/>
          </ElFormItem>
          <ElFormItem label="容器高度">
            {/* <ElInputNumber {...{modelValue: 1}} step={100}/>  不识别 step 才如下扩展这样写的*/}
            <ElInputNumber v-model={state.editData.height} {...{step: '100'} as any} />
          </ElFormItem>
        </>));
      } else {
        const { componentKey } = props.block;
        const component = props.config?.componentMap[componentKey];
      
        content.push(<ElFormItem label="组件标识">
          <ElInput v-model={state.editData.slotName}/>
        </ElFormItem>);

        if (component) {
          if (component.props) {
            content.push((<>
              {
                Object.entries(component.props || {}).map(([propName, propConfig]) => (
                  <ElFormItem label={propConfig.label}>
                    {renderEditor(propName, propConfig)}
                  </ElFormItem>)
                )
              }
            </>));
          }
          if (component.model) {
            console.log('component.model', component.model)
            content.push(<>
              {
                Object.entries(component.model || {}).map(([moduleName, label]) => (
                  <ElFormItem label={label}>
                    <ElInput v-model={state.editData.model[moduleName]} />
                  </ElFormItem>
                ))
              }
            </>);
          }
        }
      }
      return (
        <ElForm labelPosition="top">
          {content}
          <ElFormItem>
            <ElButton {...{onClick: methods.apply} as any} type="primary">确定</ElButton>
            <ElButton {...{onClick: methods.reset} as any}>重置</ElButton>
          </ElFormItem>
        </ElForm>
      );
    }
  }
})