import {
  VisualDragProvider,
  VisualEditorBlockData,
  VisualEditorComponent
} from "@/packages/visual-editors.utils";
import { defineComponent, PropType } from "vue";

import './block-resize.less';

enum Direction {
  start = 'start',
  center = 'center',
  end = 'end',
}

export const BlockResize = defineComponent({
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>,
      // required: true
    },
    component: {
      type: Object as PropType<VisualEditorComponent>,
      // required: true
    }
  },
  setup(props) {

    const { dragstart, dragend } = VisualDragProvider.inject();

    const onMousedown = (() => {
      let data = {
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startLeft: 0,
        startTop: 0,
        dragging: false,
        direction: {
          horizontal: Direction.start,
          vertical: Direction.start
        }
      };

      const mouseMove = (ev: MouseEvent) => {
        const {
          startX,
          startY,
          startWidth,
          startHeight,
          startLeft,
          startTop,
          direction,
          dragging
        } = data;
        
        if (!dragging) {
          data.dragging = true;
          // 触发事件队列的操作
          dragstart.emit();
        }

        let { clientX: moveX, clientY: moveY } = ev;

        // 判断是那个点的方向
        if (direction.horizontal === Direction.center) {
          moveX = startX;
        }
        if (direction.vertical === Direction.center) {
          moveY = startY;
        }
        
        let durX = moveX - startX;
        let durY = moveY - startY;

        const block = props.block as VisualEditorBlockData;

        // 解决拖动上边的点,下边线变化问题
        if (direction.vertical === Direction.start) {
          durY = -durY;
          block.top = startTop - durY;
        }
        // 解决拖动左边的点,右边线变化问题
        if (direction.horizontal === Direction.start) {
          durX = -durX;
          block.left = startLeft - durX;
        }


        const width = startWidth + durX;
        const height = startHeight + durY;

        block.width = width;
        block.height = height;
        block.hasResize = true;
      };
      const mouseUp = () => {
        document.body.removeEventListener('mousemove', mouseMove);
        document.body.removeEventListener('mouseup', mouseUp);
        if (data.dragging) {
          dragend.emit();
        }
      };

      // direction 判断是那个点的方向
      const mouseDown = (ev: MouseEvent, direction: { horizontal: Direction, vertical: Direction }) => {
        ev.stopPropagation();
        document.body.addEventListener('mousemove', mouseMove);
        document.body.addEventListener('mouseup', mouseUp);

        data = {
          startX: ev.clientX,
          startY: ev.clientY,
          startWidth: props.block?.width || 0,
          startHeight: props.block?.height || 0,
          startLeft: props.block?.left || 0,
          startTop: props.block?.top || 0,
          dragging: false,
          direction
        };
      };

      return mouseDown;
    })();

    return () => {
      const { width, height } = props.component?.resize || {};
      return (<>
          {/* 支持设置高度 */}
          {
            height && (<>
              <div class="block-resize block-resize__top"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.center, vertical: Direction.start})}></div>
              <div class="block-resize block-resize__bottom"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.center, vertical: Direction.end})}></div>
            </>)
          }
          {/* 支持设置宽度 */}
          {
            width && (<>
              <div class="block-resize block-resize__left"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.start, vertical: Direction.center})}></div>
              <div class="block-resize block-resize__right"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.end, vertical: Direction.center})}></div>
            </>)
          }
          {/* 支持设置宽度和高度 */}
          {
            (width && height) && (<>
              <div class="block-resize block-resize__top-left"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.start, vertical: Direction.start})}></div>
              <div class="block-resize block-resize__top-right"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.end, vertical: Direction.start})}></div>
              <div class="block-resize block-resize__bottom-left"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.start, vertical: Direction.end})}></div>
              <div class="block-resize block-resize__bottom-right"
                onMousedown={ ev => onMousedown(ev, {horizontal: Direction.end, vertical: Direction.end})}></div>
            </>)
          }
        </>)
    };
  }
});