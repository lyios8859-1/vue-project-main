import { inject, provide } from 'vue';
import { VisualEditorProps } from './visual-editor-props';

export interface VisualEditorBlockData {
  componentKey: string, // 映射 VisualEditorConfig 中 componentMap 的 component 对象
  top: number, // 组件的 top 定位值
  left: number, // 组件的 left 定位值
  zIndex: number, // 组件的定位层级
  adjustPosition: boolean  // 调整精确的鼠标位置,
  focus: boolean, // 是否选中状态
  active: boolean // 是否激活状态,
  height: number, // 组件高度
  width: number, // 组件宽度
  hasResize: boolean, // 是否调整过宽度或者高度
  props: Record<string, any>, // 组件的相关属性
  model: Record<string, string>, // 绑定的字段
  slotName?: string // 组件唯一标识
}

export interface VisualEditorModelValue {
  container: {
    width: number,
    height: number,
  },
  blocks?: VisualEditorBlockData[]
}

export interface VisualEditorMarkLine {
  x: {left: number, showLeft: number}[],
  y: {top: number, showTop: number}[]
}

export function createNewBlock ({
  component,
  top,
  left
}: {
  component: VisualEditorComponent,
  top: number,
  left: number
}): VisualEditorBlockData {
  return {
    top,
    left,
    componentKey: component!.key,
    adjustPosition: true,
    active: false,
    focus: false,
    zIndex: 0,
    width: 0,
    height: 0,
    hasResize: false,
    props: {},
    model: {}
  }
}

export interface VisualEditorComponent {
  key: string,
  label: string,
  preview: () => JSX.Element,
  render: (data: {
    props: any,
    model: any,
    custom: Record<string, any>,
    size: {
      width?: number,
      height?: number
    }
  }) => JSX.Element,
  props?: Record<string, VisualEditorProps>,
  model?: Record<string, string>,
  resize?: {
    width?: boolean,
    height?: boolean
  } 
}

export function createVisualEditorConfig () {
  const componentList: VisualEditorComponent[] = [];
  const componentMap: Record<string, VisualEditorComponent> = {};
  return {
    componentList,
    componentMap,
    registry: <_,
        Props extends Record<string, VisualEditorProps> = {},
        Model extends Record<string, string> = {},
      >(key: string, component: {
      label: string,
      preview: () => JSX.Element | string,
      render: (data: {
        size: {
          width?: number,
          height?: number
        },
        custom: Record<string, any>,
        props: { [k in keyof Props]: any },
        model: Partial<{[k in keyof Model]: any}>
        // model: Partial<{ //这里如果可以的话，优化成对应的属性，不用 any
        //   [k in keyof Model]: {
        //     value: any,
        //     onChange: (val: any) => void
        //     field: string,
        //     row: any,
        //     binding: {
        //       value: any,
        //       onChange: (val: any) => void
        //     }
        //   }
        // }>
      }) => JSX.Element,
      props?: Props,
      model?: Model,
      resize?: {
        width?: boolean,
        height?: boolean
      },

    }) => {
      const comp = {...component, key} as any
      componentList.push(comp);
      componentMap[key] = comp;
    },
    
  }
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>;

export interface VisualDragEvent {
  dragstart: {
    on: (cb: () => void) => void,
    off: (cb: () => void) => void,
    emit: () => void
  },
  dragend: {
    on: (cb: () => void) => void,
    off: (cb: () => void) => void,
    emit: () => void
  },
}

export const VisualDragProvider = (() => {
  const VISUAL_DRAG_PROVIDER = '@@VISUAL_DRAG_PROVIDER';
  return {
    provide: (data: VisualDragEvent) => {
      provide(VISUAL_DRAG_PROVIDER, data);
    },
    inject: () => {
      return inject(VISUAL_DRAG_PROVIDER) as VisualDragEvent;
    }
  }
})();

