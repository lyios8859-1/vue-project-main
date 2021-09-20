import { defineComponent, reactive, PropType, ref, computed, provide} from 'vue';
import classnames from './styles/Editor.module.scss';
import { ComponentConfig, EditorConfig, VisualEditorModelValue, VisualEditorBlockData, createNewBlock, VisualDragEvent} from './visual-editor.utils';
import EditorBlock from './EditorBlock';
import { registerConfig } from './editor-config';
import { useVisualCommand } from './visual.command';
import { usePlainEvent } from "./plugins/event";

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
  emits: ['update:modelValue', 'dragstart', 'dragend']
  // {
  //   "update:modelValue": (val?: VisualEditorModelValue) => val,
  //   "dragstart": (val?: VisualEditorBlockData) => val,
  //   "dragend": (val?: VisualEditorBlockData) => val
  // }
  ,
  setup(props, { emit }) {

    const setPrefix = (suffix: string)  => 'ly-visual-editor' + '-' + suffix;

    const config = reactive(registerConfig);
    provide<EditorConfig>('config', config);

    //#region 发布订阅模式,处理事件
    const useEvent = usePlainEvent({
      dragstart: () => {
        // 触发的时候可以做点其他操作
        // console.log("doStart");
        emit("dragstart", dataModel.value.blocks); // 向外触发
      },
      dragend: () => {
        // 触发的时候可以做点其他操作
        // console.log("dragend");
        emit("dragend", dataModel.value.blocks); // 向外触发
      },
    });
    
    provide<VisualDragEvent>('drag', useEvent); // 提供给子组件用的事件


    // useEvent.on.dragstart(() => {
    //   console.log("放置组件到容器之前做点什么");
    // });
    // useEvent.on.dragend(() => {
    //   console.log("放置组件到容器之后做点什么");
    // });
    //#endregion

    // 数据源
    const dataModel = ref(props.modelValue as VisualEditorModelValue);
    // console.log('datas', dataModel.value);

    // 编辑器容画布样式可编辑
    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`
    }));

    const canvasSelectedIndex = ref(-1); // 记录当前选中组件的索引
    const state = reactive({
      selectedBlock: computed(() => (dataModel.value.blocks || [])[canvasSelectedIndex.value]), // 当前选中的组件，
      editing: true,
      preview: true,
      menuSelectedIndex: -1, // 记录当前菜单拖动组件的索引, 用于判断是否要拖动当前菜单的组件
    })

    const canvasContentRef = ref(null as null | {} as HTMLDivElement);

    // 筛选出选中和未选中数据
    const focusData = computed(() => {
      const focus: VisualEditorBlockData[] = [];
      const unFocus: VisualEditorBlockData[] = [];
      (dataModel.value.blocks || []).forEach((block: VisualEditorBlockData) => (block.focus ? focus : unFocus).push(block));
      return {
        unFocus, // 未选中的数据
        focus
      }
    });

    const stateMethods = {
      toggleHandleEdit: () => {
        state.editing = !state.editing;
      },
      tiggleHandlePreview: () => {
        state.preview = !state.preview;
      }
    }

    //#region 菜单拖动
    const menuDraggier = (() => {
      let currentComponent = null as null | ComponentConfig;
  
      // 画布容器事件
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
          const blocks = dataModel.value.blocks || [];
  
          blocks.push(createNewBlock({
            component: currentComponent!,
            top: e.offsetY,
            left: e.offsetX
          }));
          dataModel.value = {...dataModel.value, blocks};

          useEvent.emit.dragend();
        }
      }

      const handler = {
        dragstart: (el: HTMLElement, component: ComponentConfig, index: number) => {
          canvasContentRef.value.addEventListener('dragenter', canvasHandler.dragenter);
          canvasContentRef.value.addEventListener('dragover', canvasHandler.dragover);
          canvasContentRef.value.addEventListener('dragleave', canvasHandler.dragleave);
          canvasContentRef.value.addEventListener('drop', canvasHandler.drop);
          
          currentComponent = component;
          state.menuSelectedIndex = index;
          useEvent.emit.dragstart();
        },
        dragend: (el: HTMLElement, component: ComponentConfig) => {
          el.draggable = false;
          state.menuSelectedIndex = -1;
  
          el.ondragstart = null;
          el.ondragend = null;
  
          currentComponent = null;
  
          canvasContentRef.value.removeEventListener('dragenter', canvasHandler.dragenter);
          canvasContentRef.value.removeEventListener('dragover', canvasHandler.dragover);
          canvasContentRef.value.removeEventListener('dragleave', canvasHandler.dragleave);
          canvasContentRef.value.removeEventListener('drop', canvasHandler.drop);
        }
      }

      // 菜单项目容器事件
      const menuHandler = {
        mousedown: (e: Event, component: ComponentConfig, index: number) => {
          const target = e.currentTarget as HTMLElement;
  
          target.draggable = true;
          target.ondragstart = () => handler.dragstart(target, component, index);
          target.ondragend = () => handler.dragend(target, component);  
        },
        mouseup: (e: Event, component: ComponentConfig) => {
          const target = e.currentTarget as HTMLElement;
          target.draggable = false;
          state.menuSelectedIndex = -1;
          target.ondragstart = null;
          target.ondragend = null;
        }
      }

      return menuHandler;
    })();
    //#endregion

    //#region 画布容器中组件拖动
    const blockDraggier = (() => {
      let dragState = {
        startX: 0,
        startY: 0,
        startPos: [] as { left: number, top: number }[]
      };
      const mousemove = (e: MouseEvent) => {
        const durX = e.clientX - dragState.startX;
        const durY = e.clientY - dragState.startY;
        // 拖动选中的组件
        focusData.value.focus.forEach((block, index) => {
          block.left = dragState.startPos[index].left + durX;
          block.top = dragState.startPos[index].top + durY;
        });
      }

      const mouseup = () => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        useEvent.emit.dragend();
      }

      const mousedown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
        }
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
        useEvent.emit.dragstart();
      }

      return {
        mousedown
      };
    })();
    //#endregion

    //#region 画布容器中组件是否激活事件
    const methods = {
      /**
       * 清除选中状态
       */
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = dataModel.value.blocks || [];
        if (!blocks.length) return;
        if (!!block) {
          blocks = blocks.filter(item => item !== block);
        }
        blocks.forEach(b => b.focus = false);
      },
      updataBlocks: (blocks?: VisualEditorBlockData[]) => {
        dataModel.value = {
          ...dataModel.value,
          blocks
        }
      }
    };
    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            // 如果是非预览状态返回
            if (!state.preview) return;
            e.stopPropagation();
            e.preventDefault();

            if (!e.shiftKey) {
              // 点击空白处,清除所有的选中状态
              methods.clearFocus();
              // 等 -1 就是数组中不存在了, 没有选中
              canvasSelectedIndex.value = -1;
            }
          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
            // 如果是非预览状态返回
            if (!state.preview) return;
            // 编辑状态下阻止默认事件和事件冒泡
            e.stopPropagation();
            e.preventDefault();
            // 这种是点击本身也会取消选中状态
            if (e.shiftKey) {
              // 若按住了 shift 键, 此时没有选中,
              if (focusData.value.focus.length <= 1) {
                block.focus = true;
              } else {
                block.focus = !block.focus;
              }
            } else {
              if (!block.focus) {
                block.focus = true;
                // 排除当前 block
                methods.clearFocus(block);
              }
            }

            // 记录画布区域选中的当前组件
            canvasSelectedIndex.value = index;
            // 监听鼠标按下的事件
            blockDraggier.mousedown(e);
          }
        }
      }
    })();
    //#endregion

    const otherHandler = {
      onContextmenu: (e: MouseEvent, block: VisualEditorBlockData) => {

      }
    }

    const commander = useVisualCommand({
      focusData,
      dataModel,
      updataBlocks: methods.updataBlocks,
      event: useEvent
    });

    //#region 操作栏按钮组
    const buttons = [
      {
        label: "撤销",
        icon: "icon-back",
        handler: () => {
          console.log("撤销");
          commander.undo();
        },
        tip: "ctrl+z",
      },
      {
        label: "重做",
        icon: "icon-forward",
        handler: () => {
          console.log("重做");
          commander.redo();
        },
        tip: "ctrl+y, ctrl+shift+z",
      },
      {
        label: "删除",
        icon: "icon-delete",
        handler: () => {
          // 删除就是保留未选中的
          console.log("删除");
          commander.delete();
        },
        tip: "ctrl+d, backspace, delete",
      },
      {
        label: "清空",
        icon: "icon-reset",
        handler: () => {
          console.log("清空");
          commander.clear();
        },
      },
      {
        label: () => state.preview ? '预览' : '编辑',
        icon: () => state.preview ? 'icon-browse' : 'icon-edit',
        handler: () => {
          stateMethods.tiggleHandlePreview();
          console.log(state.preview ? '预览' : '编辑')
        }
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          stateMethods.toggleHandleEdit();
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
                      onMousedown={e => menuDraggier.mousedown(e, component, index)}
                      onMouseup={e => menuDraggier.mouseup(e, component)}
                      class={[classnames['editor-left-item'], state.menuSelectedIndex === index && classnames['drag']]}
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
                  {...focusHandler.container}
                >
                  {
                    dataModel.value.blocks?.map((block, index) => {
                      return (
                        <EditorBlock
                          key={index}  
                          block={block}
                          {...{
                            onMousedown: (ev: MouseEvent) => focusHandler.block.onMousedown(ev, block, index),
                            onContextmenu: (ev: MouseEvent) => otherHandler.onContextmenu(ev, block)
                          }}
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
            <span class={classnames['preview-editor']} onClick={stateMethods.toggleHandleEdit}>继续编辑</span>
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