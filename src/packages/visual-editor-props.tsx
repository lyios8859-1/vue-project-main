export enum VisualEditorPropsType {
  input = 'input',
  color = 'color',
  select = 'select',
  table = 'table'
}

export type VisualEditorSelectOptions = {
  label: string,
  val: string
}[]

export type VisualEditorTableOption = {
  options: {
    label: string, // 列表显示文本
    field: string, // 列绑定字段
  }[],
  showKey: string // 
};

// export interface VisualEditorProps {
//   type: VisualEditorPropsType,
//   label: string,
//   options?: VisualEditorSelectOptions | VisualEditorTableOptions
// }
// 或者
// export type VisualEditorProps = {
//   type: VisualEditorPropsType, 
//   label: string, // 显示的文字
// } | {
//   options?: VisualEditorSelectOptions,
// } | {
//   options?: VisualEditorTableOptions
// }
export type VisualEditorProps = {
  type: VisualEditorPropsType, 
  label: string, // 显示的文字
} & {
  options?: VisualEditorSelectOptions,
} & {
  table?: VisualEditorTableOption
}

/**
 * 创建输入框
 * @param label 
 * @returns 
 */
export function createEditorInputProp(label: string): VisualEditorProps {
  return {
    type: VisualEditorPropsType.input,
    label
  }
}

/**
 * 创建颜色
 * @param label 
 * @returns 
 */
export function createEditorColorProp(label: string): VisualEditorProps {
  return {
    type: VisualEditorPropsType.color,
    label
  }
}

/**
 * 创建下列选择框
 * @param label 
 * @param options 
 * @returns 
 */
export function createEditorSelectProp(label: string, options: VisualEditorSelectOptions): VisualEditorProps {
  return {
    type: VisualEditorPropsType.select,
    label,
    options
  }
}


export function createEditorTableProp(label: string, option: VisualEditorTableOption): VisualEditorProps {
  return {
    type: VisualEditorPropsType.table,
    label,
    table: option
  }
}