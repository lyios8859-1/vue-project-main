import {
  defineComponent,
  PropType,
  computed,
  reactive,
  ref
} from 'vue';

import {
  VisualEditorModelValue,
  VisualEditorConfig,
  VisualEditorComponent,
  VisualEditorBlockData,
  VisualEditorMarkLine,
  createNewBlock,
  VisualDragProvider
} from './visual-editors.utils';

import './visual-editors.less';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editors-blocks';
import { useVisualCommand } from './visual.commad';
import { usePlainEvent } from './plugins/events';
import { $$dialog } from './utils/dialog-service';
import { ElMessageBox } from 'element-plus';
import { $$dropdown, DropdwonOption } from './utils/dropdown-service';
import { VisualEditorOperator } from './visual-editor-operator';

export const LyEditor = defineComponent({
  name: 'ly-editor',
  props: {
    modelValue: {
      type: Object as PropType<VisualEditorModelValue>,
      required: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      required: true
    },
    formData: {
      type: Object as PropType<Record<string, any>>,
      required: true
    },
    customProps: {
      type: Object as PropType<Record<string, any>>
    }
  },
  emits: {
    'update:modelValue': (val?: VisualEditorModelValue) => val
  },
  setup(props, ctx) {
    const dataModel = useModel(() => props.modelValue, (val) => ctx.emit('update:modelValue', val));
    const containerRef = ref({} as HTMLDivElement);
    
    const dragstart = usePlainEvent();
    const dragend = usePlainEvent();
    VisualDragProvider.provide({dragstart, dragend}); // 提供给子组件用的事件

    const selectIndex = ref(-1);
    const state = reactive({
      selectBlock: computed(() => (dataModel.value.blocks || [])[selectIndex.value]), // 当前选中的组件，
      preview: false, // 是否预览
      editing: true // 是否开启编辑
    });
    // dragstart.on(() => {
    //   console.log('dragstart')
    // })
    // dragend.on(() => {
    //   console.log('dragend')
    // })

    const classse = computed(() => [
      'ly-editor__container',
      {
        'ly-editor-not-preview': !state.preview
      }
    ]);

    const methods = {
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = dataModel.value.blocks || [];
        if (!blocks.length) return;
        if(block) {
          blocks = blocks.filter(item => item !== block);
        }
        blocks.forEach(b => b.focus = false);
      },
      updateBlocks: (blocks?: VisualEditorBlockData[]) => {
        dataModel.value = {
          ...dataModel.value,
          blocks
        }
      },
      openEdit: () => {
        state.editing = true;
      }
    };

    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`
    }));

    const menuDraggier = (() => {
      let component = null as null | VisualEditorComponent;
      // const createNewBlock = ({ component, top, left}: {
      //   component: VisualEditorComponent,
      //   top: number,
      //   left: number
      // }) => ({
      //   top,
      //   left,
      //   componentKey: component!.key,
      //   adjustPosition: true,
      //   active: false,
      //   focus: false,
      //   zIndex: 0,
      //   width: 0,
      //   height: 0,
      //   hasResize: false,
      //   props: {},
      //   model: {}
      // });
      const containerHandler = {
        dragEnter: (e: DragEvent) => e.dataTransfer!.dropEffect = 'move',
        dragLeave: (e: DragEvent) => e.dataTransfer!.dropEffect = 'none',
        dragOver: (e: DragEvent) => e.preventDefault(),
        drop: (e: DragEvent) => {
          // const blocks = dataModel.value.blocks || [];
          // blocks.push(createNewBlock({
          //   component: component!,
          //   top: e.offsetY,
          //   left: e.offsetX
          // }));
          // dataModel.value = {
          //   ...dataModel.value,
          //   blocks
          // };

          const blocks = [...dataModel.value.blocks || []];
          blocks.push(createNewBlock({
            component: component!,
            top: e.offsetY,
            left: e.offsetX,
          }));
          methods.updateBlocks(blocks);
        }
      };

      const blockHandler = {
        dragStart: (e: DragEvent, curComponent: VisualEditorComponent) => {
          containerRef.value.addEventListener('dragenter', containerHandler.dragEnter);
          containerRef.value.addEventListener('dragover', containerHandler.dragOver);
          containerRef.value.addEventListener('dragleave', containerHandler.dragLeave);
          containerRef.value.addEventListener('drop', containerHandler.drop);
          component = curComponent;
          dragstart.emit()
        },
        dragEnd: () => {
          containerRef.value.removeEventListener('dragenter', containerHandler.dragEnter);
          containerRef.value.removeEventListener('dragover', containerHandler.dragOver);
          containerRef.value.removeEventListener('dragleave', containerHandler.dragLeave);
          containerRef.value.removeEventListener('drop', containerHandler.drop);
          component = null;
          dragend.emit()
        },
      };

      return blockHandler;
    })();

    // 选中和未选中
    const focusData = computed(() => {
      const focus: VisualEditorBlockData[] = [];
      const unFocus: VisualEditorBlockData[] = [];
      (dataModel.value.blocks || []).forEach((block: VisualEditorBlockData )=> (block.focus ? focus : unFocus).push(block));
      return {
        unFocus, // 未选中的数据
        focus
      }
    });

    const commander = useVisualCommand({
      focusData,
      updateBlocks: methods.updateBlocks,
      dataModel,
      dragstart,
      dragend
    });

    const blockDraggier = (() => {
      const mark = reactive({
        x: null as null | number,
        y: null as null | number
      });
      let dragState = {
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startPos: [] as { left: number, top: number }[],
        dragging: false,
        markLines: {} as VisualEditorMarkLine,
      };
      const mouseMove = (e: MouseEvent) => {

        if (!dragState.dragging) {
          dragState.dragging = true;
          dragstart.emit();
        }
        let { clientX: moveX, clientY: moveY} = e;
        const { startX, startY } = dragState;

        // 按住 shift 键的操作 单方向移动（水平或者垂直移动）
        if (e.shiftKey) {
          if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
            moveY = startY;
          } else {
            moveX = startX;
          }
        }

        const currentLeft = dragState.startLeft + moveX - startX;
        const currentTop = dragState.startTop + moveY - startY;
        const currentMark = {
          x: null as null | number,
          y: null as null | number
        }

        // 计算参考线位置
        for (let i = 0; i < dragState.markLines.y.length; i++) {
          const { top, showTop } = dragState.markLines.y[i];
          if (Math.abs(top - currentTop) < 5) {
            moveY = top + startY - dragState.startTop;
            currentMark.y = showTop;
            break;
          }
        }
        for (let i = 0; i < dragState.markLines.x.length; i++) {
          const { left, showLeft } = dragState.markLines.x[i];
          if (Math.abs(left - currentLeft) < 5) {
            moveX = left + startX - dragState.startLeft;
            currentMark.x = showLeft;
            break;
          }
        }
        mark.x = currentMark.x;
        mark.y = currentMark.y;
        const durX = moveX - startX;
        const durY = moveY - startY;

        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY;
          block.left = dragState.startPos[index].left + durX;
        })
      };
      const mouseUp = () => {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
        mark.x = null;
        mark.y = null;
        if (dragState.dragging === true) {
          dragend.emit();
        }
      };
      const mouseDown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startLeft: state.selectBlock?.left!,
          startTop: state.selectBlock?.top!,
          startPos: focusData.value.focus.map(({top, left}) => ({top, left})),
          dragging: false,
          markLines: (() => {
            const { unFocus } = focusData.value;
            const { width, height } = state.selectBlock!;
            const lines: VisualEditorMarkLine = {x: [], y: []};
            const focus = [
              ...unFocus,
              { // 保证有在容器居中的参考线
                top: 0,
                left: 0,
                width: dataModel.value.container.width,
                height: dataModel.value.container.height
              }
            ];
            focus.forEach(block => {
              const { top: t, left: l, width: w, height: h } = block;
              // 最有一个选中移动的元素，与其他元素的几种参考线对其方式
              //#region 垂直方向的对其
              // 顶部对顶部
              lines.y.push({ top: t, showTop: t });
              // 顶部对底部
              lines.y.push({ top: t + h, showTop: t + h });
              // 中间对中间 （垂直）
              lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h / 2 });
              // 底部对顶部
              lines.y.push({ top: t - height, showTop: t });
              // 底部对底部
              lines.y.push({ top: t + h - height, showTop: t + h });
              //#endregion

              //#region 说平方向的对其
              // 左边对左边
              lines.x.push({ left: l, showLeft: l });
              // 左边对右边
              lines.x.push({ left: l + w, showLeft: l + w });
              // 中间对中间 （水平）
              lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w / 2 });
              // 右边对左边
              lines.x.push({ left: l - width, showLeft: l });
              // 右边对右边
              lines.x.push({ left: l + w - width, showLeft: l + w });
              //#endregion
            })
            return lines;
          })()
        };
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
      };
      
      return {
        mark,
        mouseDown
      };
    })();

    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            if (state.preview) return;
            e.preventDefault();

            if (e.currentTarget !== e.target) return;// 解决 element-plus 鼠标抬起时报错 Cannot read property 'target' of undefined
            if (!e.shiftKey) {
              // 点击空白处,清除所有的选中状态
              methods.clearFocus();
              selectIndex.value = -1; // 等 -1 就是数组中不存在了
            }
          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
            if (state.preview) return; 
            // e.stopPropagation();
            // e.preventDefault();


            // 这种是点击本身也会取消选中状态
            if (e.shiftKey) {
              // 这里的操作可以优化
              // 若按住了 shift 键, 此时没有选中,
              if (focusData.value.focus.length <= 1) {
                block.focus = true;
              } else {
                block.focus = !block.focus;
              }
            } else {
              if (!block.focus) {
                block.focus = true;
                methods.clearFocus(block);
              }
            }

            // 只有元素未选中状态下， 才去处理
            // if (!block.focus) {
            //   if (!e.shiftKey) {
            //     block.focus = !block.focus;
            //     methods.clearFocus(block);
            //   } else {
            //     block.focus = true;
            //   }
            // }

            selectIndex.value = index;
            blockDraggier.mouseDown(e);
          }
        }
      }
    })();
    
    const otherHandler = {
      // 鼠标右键事件
      onContextmenu: (e: MouseEvent, block: VisualEditorBlockData) => {
        if (state.preview) return;
        e.preventDefault();
        e.stopPropagation();

        // block.focus = true;
        $$dropdown({
          reference: e,
          content: () => (<>
            <DropdwonOption label="置顶节点" icon="icon-place-top" {...{onClick: commander.placeTop}}/>
            <DropdwonOption label="置底节点" icon="icon-place-bottom" {...{onClick: commander.placeBottom}}/>
            <DropdwonOption label="删除节点" icon="icon-delete" {...{onClick: commander.delete}}/>
            <DropdwonOption label="查看数据" icon="icon-browse" {...{onClick: () => otherHandler.showBlockData(block)}}/>
            <DropdwonOption label="导入节点" icon="icon-import" {...{onClick: () => otherHandler.importBlockData(block)}}/>
          </>)
        });
      },
      showBlockData: (block: VisualEditorBlockData) => {
        $$dialog.textarea(JSON.stringify(block, null, 2), '节点数据', { editReadonly: true });
      },
      importBlockData: async (block: VisualEditorBlockData) => {
        const text = await $$dialog.textarea('', '请输入节点 JSON 字符串');
        try {
          const data = JSON.parse(text || '');
          commander.updateBlock(data, block); // 更新数据显示到页面
        } catch (e) {
          ElMessageBox.alert('解析json字符串出错');
        }
      }
    };

    const buttons = [
      { label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z' },
      { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y,ctrl+shift+z' },
      { label: '删除', icon: 'icon-delete', handler: commander.delete, tip: 'ctrl+d,backspace,delete' },
      { label: '清空', icon: 'icon-reset', handler: commander.clear },
      { label: '置顶', icon: 'icon-place-top', handler: () => commander.placeTop(), tip: 'ctrl+up' },
      { label: '置底', icon: 'icon-place-bottom', handler: () => commander.placeBottom(), tip: 'ctrl+down' },
      {
        label: '导入', icon: 'icon-import', handler: async () => {
          const text = await $$dialog.input('', '请输入倒入的JSON字符串');
          try {
            const data = JSON.parse(text || '');
            dataModel.value = data; // 修改数据显示到页面
          } catch (e) {
            ElMessageBox.alert('解析json字符串出错');
          }
        }
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据', { editReadonly: true })
      },
      {
        label: () => state.preview ? '编辑' : '预览',
        icon: () => state.preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!state.preview) {
            methods.clearFocus();
          }
          state.preview = !state.preview;
        }
      },
      {
        label: '关闭',
        icon: 'icon-close',
        handler: () => {
          methods.clearFocus();
          state.editing = false;
        }
      },
    ];
    return () => (<>
     <div class="editor-content__container" style={containerStyles.value}>
       {/*这部分影响到拖入后的元素位置问题*/}
        {
          dataModel.value?.blocks?.map((block, index) => (
            <VisualEditorBlock 
              config={props.config}
              block={block}
              formData={props.formData}
              key={index}
              slots={ctx.slots}
              customProps={props.customProps}
            />
          ))
        }
        <div class="ly-visual-container-edit__button" onClick={methods.openEdit}>
          <i class="iconfont icon-edit"></i>
          <span>编辑</span>
        </div>
      </div>

      <div class={classse.value} v-show={state.editing}>
        <div class="ly-editor__menu custom-bar">
          {
            props.config.componentList.map(component => {
              return (
                <div class="visusl-editor-menu__item"
                  draggable
                  onDragstart={(e) => menuDraggier.dragStart(e, component)}
                  onDragend={menuDraggier.dragEnd}
                >
                  <span class="visusl-editor-menu__item__label">{component.label}</span>
                  {component.preview()}
                </div>
              )
            })
          }
        </div>
        <div class="ly-editor__head">
          {
            buttons.map((btn, index) => {
              const label = typeof btn.label === 'function' ? btn.label() : btn.label;
              const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon;

              const button = (
                <div
                  key={index}
                  class="visual-editor__head__button"
                  onClick={btn.handler}
                >
                  <i class={`iconfont ${icon}`}></i>
                  <span>{label}</span>
                </div>
              )
              return !btn.tip ? button : (
                <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                 {button}
                </el-tooltip>
              )
            })
          }
        </div>
        <div class="ly-editor__opeartor">
          <VisualEditorOperator
            block={state.selectBlock}
            config={props.config}
            dataModel={dataModel}
            updateBlock={commander.updateBlock}
            updateModelValue={commander.updateModelValue}/>
        </div>
        <div class="ly-editor__body custom-bar">
          <div class="editor-content__container"
            ref={containerRef}
            style={containerStyles.value}
            {...focusHandler.container}
          >
            {
              dataModel.value?.blocks?.map((block, index) => {
                return (
                  <VisualEditorBlock 
                  config={props.config}
                  block={block}
                  formData={props.formData}
                  key={index}
                  slots={ctx.slots}
                  customProps={props.customProps}
                  {...{
                    onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block, index),
                    onContextMenu: (e: MouseEvent) => otherHandler.onContextmenu(e, block),
                  }}
                />
                )
              })
            }

            {/* <!-- 参考线 --> */}
            {blockDraggier.mark.y !== null && <div class="visual-editor-mark-line__y" style={{top: `${blockDraggier.mark.y}px`}}></div>}
            {blockDraggier.mark.x !== null && <div class="visual-editor-mark-line__x" style={{left: `${blockDraggier.mark.x}px`}}></div>}
            {/* <!-- 参考线 --> */}
          </div>
        </div>
      </div>
    </>);
  }
});