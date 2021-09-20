// 单个组件的数据格式
export interface VisualEditorBlockData {
  key: string, // 这个 key 和组件 VisualEditorComponent 中定义的 key 是一一对应的, 映射 VisualEditorConfig 中的 componentMap 对象
  top: number, // 组件的在画布容器中的横坐标
  left: number, // 组件的在画布容器中的纵坐标
  width: number, // 组件的宽度
  height: number, // 组件的高度
  zIndex: number, // 组件的定位的 z-index 值
  adjustPosition?: boolean, // 是否首次拖动调整组件位于居中的位置
  focus: boolean, // 是否为选中状态
}

// 原始数据格式
export interface VisualEditorModelValue {
  container: {
    width: number,
    height: number,
  },
  blocks?: VisualEditorBlockData[]
}

export interface ComponentConfig {
  key: string, // 和 data.json 中的数据中的 key 对应起来
  label: string,
  preview: (value: any) => typeof value,
  render: (value: any) => typeof value
}
export interface VisualDragEvent {
  on: {
    dragstart: (cb: () => void) => void;
    dragend: (cb: () => void) => void;
  };
  once: {
    dragstart: (cb: () => void) => void;
    dragend: (cb: () => void) => void;
  };
  off: {
    dragstart: (cb: () => void) => void;
    dragend: (cb: () => void) => void;
  };
  emit: {
    dragstart: (cb: () => void) => void;
    dragend: (cb: () => void) => void;
  }
}
export function createNewBlock({
  component,
  top,
  left
} : {
  component: ComponentConfig,
  top: number,
  left: number,
}): VisualEditorBlockData {
  return {
    top,
    left,
    key: component!.key,
    adjustPosition: true,
    focus: false,
    width: 0,
    height: 0,
    zIndex: 0,
  }
}

export interface EditorConfig {
  register: (component: ComponentConfig) => void;
  componentList: ComponentConfig[];
  componentMap: { [k: string]: ComponentConfig };
}

export function createEditorConfig(): EditorConfig {
  const componentList: ComponentConfig[] = [];
  const componentMap: { [k: string]: ComponentConfig } = {};

  return {
    componentList,
    componentMap,
    register: (component: ComponentConfig) => {
      componentList.push(component);
      componentMap[component.key as string] = component;
    }
  }
}