import { defineComponent, reactive, PropType, ref, computed, provide} from 'vue';
import classnames from './Editor.module.scss';
import { ComponentConfig, EditorConfig, VisualEditorModelValue, VisualEditorBlockData} from './visual-editor.utils';
import EditorBlock from './EditorBlock';
import { registerConfig } from './editor-config';
import deepcopy from 'deepcopy';

export default defineComponent({
  name: 'VisualEditor',
  props: {
    // 组件的基本信息
    modelValue: {
      type: Object as PropType<VisualEditorModelValue>,
      required: true
    },
    config: {
      type: Object as PropType<EditorConfig>,
      required: false
    }
  },
  emits: {
    "update:modelValue": (val?: VisualEditorModelValue) => val,
  },
  setup(props, { emit }) {
    const config = reactive(registerConfig);
    provide<EditorConfig>('config', config);

    // 数据源
    const dataModel = ref(props.modelValue as VisualEditorModelValue);
    // console.log('datas', dataModel.value);

    // 编辑器容画布样式可编辑
    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`
    }));

    const state = reactive({
      editing: true,
      preview: true,
      currentIdnex: -1,
    })

    const canvasContentRef = ref(null as null | {} as HTMLDivElement);

    const methods = {
      toggleHandleEdit: () => {
        state.editing = !state.editing;
      },
      tiggleHandlePreview: () => {
        state.preview = !state.preview;
      }
    }
    const setPrefix = (suffix: string)  => 'ly-visual-editor' + '-' + suffix;

    let currentComponent = null as null | VisualEditorBlockData;

    const canvasHandler = {
      dragenter: (e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'move';
      },
      dragover: (e: DragEvent) => {
        e.preventDefault();
      },
      dragleave: (e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'none';
      },
      drop: (e: DragEvent) => {
        const blocks = dataModel.value.blocks;

        dataModel.value = {
          ...dataModel.value,
          blocks: [
            ...blocks,
            {
              top: e.offsetY,
              left: e.offsetX,
              key: currentComponent!.key
            }
          ]
        }
      

        emit('update:modelValue', dataModel.value);
        currentComponent = null;
      }
    }

    const handler = {
      dragstart: (el: HTMLElement, component: ComponentConfig) => {
        canvasContentRef.value.addEventListener('dragenter', canvasHandler.dragenter);
        canvasContentRef.value.addEventListener('dragover', canvasHandler.dragover);
        canvasContentRef.value.addEventListener('dragleave', canvasHandler.dragleave);
        canvasContentRef.value.addEventListener('drop', canvasHandler.drop);
      },
      dragend: (el: HTMLElement, component: ComponentConfig) => {
        el.draggable = false;
        state.currentIdnex = -1;

        el.ondragstart = null;
        el.ondragend = null;
      }
    }

    const menuHandler = {
      mousedown: (e: Event, component: ComponentConfig, index: number) => {
        const target = e.currentTarget as HTMLElement;
        target.draggable = true;
        state.currentIdnex = index;

        currentComponent = component;

        target.ondragstart = () => handler.dragstart(target, component);
        target.ondragend = () => handler.dragend(target, component);  
      },
      mouseup: (e: Event, component: ComponentConfig) => {
        const target = e.currentTarget as HTMLElement;
        target.draggable = false;
        state.currentIdnex = -1;
        target.ondragstart = null;
        target.ondragend = null;
      }
    }

    //#region 操作栏按钮组
    const buttons = [
      {
        label: "撤销",
        icon: "icon-back",
        handler: () => {
          console.log("撤销");
        },
        tip: "ctrl+z",
      },
      {
        label: "重做",
        icon: "icon-forward",
        handler: () => {
          console.log("重做");
        },
        tip: "ctrl+y, ctrl+shift+z",
      },
      {
        label: "清空",
        icon: "icon-reset",
        handler: () => {
          console.log("清空");
        },
      },
      {
        label: () => state.preview ? '预览' : '编辑',
        icon: () => state.preview ? 'icon-browse' : 'icon-edit',
        handler: () => {
          methods.tiggleHandlePreview();
          console.log(state.preview ? '预览' : '编辑')
        }
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          methods.toggleHandleEdit();
        }
      },
    ];
    //#endregion

    return () => (<>
      {
        state.editing ? (
          <div class={classnames['ly-visual-editor']}>
            <div class={classnames[setPrefix('left')]}>
              {
                config?.componentList.map((component, index) => {
                  return (<>
                    <div
                      onMousedown={e => menuHandler.mousedown(e, component, index)}
                      onMouseup={e => menuHandler.mouseup(e, component)}
                      class={[classnames['editor-left-item'], state.currentIdnex === index && classnames['drag']]}
                    >
                      <p style={{pointerEvents: 'none'}} class={classnames['label']}>{component.label}</p>
                      <div style={{width: '44%', textAlign: 'center', pointerEvents: 'none'}}>{component.preview({})}</div>
                    </div>
                  </>)
                })
              }
            </div>

            <div class={classnames[setPrefix('top')]}>
              {
                buttons.map((btn, index) => {
                  
                  const label = typeof btn.label === "function" ? btn.label() : btn.label;
                  const icon = typeof btn.icon === "function" ? btn.icon() : btn.icon;

                  const button = (
                    <div
                      key={index}
                      class={[classnames['btn'], classnames['gap']]}
                      onClick={btn.handler}
                    >
                      <i class={`iconfont ${icon}`}></i>
                      <span>{label}</span>
                      {btn.tip && <span class={classnames['tip']}>{btn.tip}</span>}
                    </div>
                  );
                  return button;
                })
              }
            </div>

            <div class={classnames[setPrefix('right')]}>右边</div>

            <div class={classnames[setPrefix('container')]}>
              <div class={[classnames[setPrefix('container-canvas')], classnames['ly-custom-bar']]}> {/* scroll */}
                <div
                  class={[classnames[setPrefix('container-canvas-content')], classnames[state.preview ? 'isEditOrpreview' : '']]}
                  style={containerStyles.value}
                  ref={canvasContentRef}
                >
                  {
                    dataModel.value.blocks?.map((block, index) => {
                      return (
                        <EditorBlock
                          key={index}  
                          block={block}
                        />
                      )
                    })
                  }
                  
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div class={[classnames['ly-visual-editor-preview'], classnames['ly-custom-bar']]}>
            <span class={classnames['preview-editor']} onClick={methods.toggleHandleEdit}>继续编辑</span>
            <div
              class={[classnames[setPrefix('container-canvas-content')], classnames['preview']]}
              style={containerStyles.value}
            >
              {
                dataModel.value.blocks?.map((block, index) => {
                  return (
                    <EditorBlock
                      key={index}  
                      block={block}
                    />
                  )
                })
              }
            </div>
          </div>
        )
      }
    </>)
  }
});