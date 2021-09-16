/**
 * 创建列表区的组件
 */

import { ElButton, ElInput } from 'element-plus';

import { createEditorConfig } from './visual-editor.utils';

export const registerConfig = createEditorConfig();

registerConfig.register({
  key: 'text', // 和 data.json 中的数据中的 key 对应起来
  label: '文本',
  preview: () => <span>预览文本</span>,
  render: () => '渲染文本'
});

registerConfig.register({
  key: 'button', // 和 data.json 中的数据中的 key 对应起来
  label: '按钮',
  preview: () => <ElButton>预览按钮</ElButton>,
  render: () => <ElButton>渲染按钮</ElButton>
});

registerConfig.register({
  key: 'input', // 和 data.json 中的数据中的 key 对应起来
  label: '输入框',
  preview: () => <ElInput placeholder="预览输入框" />,
  render: () => <ElInput placeholder="渲染输入框" />
});

