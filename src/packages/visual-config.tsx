import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus';
import { NumberRange } from './components/number-range/number-range';
import { createEditorColorProp, createEditorInputProp, createEditorSelectProp, createEditorTableProp } from './visual-editor-props';
import { createVisualEditorConfig } from './visual-editors.utils';

import './visual-config.less';

export const visualConfig = createVisualEditorConfig();

visualConfig.registry('text', {
  label: '文本',
  preview: () => '预览文本',
  render: ({props}) => (<span style={{color: props.color, fontSize: props.size}}>{props.text || '文本'}</span>),
  props: {
    text: createEditorInputProp('显示文本'),
    color: createEditorColorProp('字体颜色'),
    size: createEditorSelectProp('字体大小', [
      { label: '14px', val: '14px' },
      { label: '16px', val: '16px' },
      { label: '18px', val: '18px' },
      { label: '24px', val: '24px' },
    ])
  }
});

visualConfig.registry('button', {
  label: '按钮',
  preview: () => <ElButton>按钮</ElButton>,
  render: ({props, size, custom}) => (
    <ElButton
      type={props.type} 
      size={props.size}
      {...custom}
      style={
        {
          width: size.width ? `${size.width}px` : null, // 设置宽度, 判断是为了解决撤销不了的问题
          height: size.height ? `${size.height}px` : null // 设置高度， 判断是为了解决撤销不了的问题
        }
      }
    >
      {props.text || '按钮'}
    </ElButton>
  ),
  props: {
    text: createEditorInputProp('显示文本'),
    type: createEditorSelectProp('按钮类型', [
      { label: '基础', val: 'primary' },
      { label: '成功', val: 'success' },
      { label: '信息', val: 'info' },
      { label: '警告', val: 'warning' },
      { label: '危险', val: 'danger' },
    ]),
    size: createEditorSelectProp('按钮大小',[
      { label: '默认', val: '' },
      { label: '中', val: 'medium' },
      { label: '小', val: 'small' },
      { label: '极小', val: 'mini' },
    ])
  },
  resize: {
    width: true, // 允许设置宽度
    height: true // 允许设置高度 
  }
});

visualConfig.registry('input', {
  label: '输入框',
  preview: () => <ElInput modelValue={""}/>,
  render: ({model, size, custom}) => {
    return (
      <ElInput
      {...model.default}
      {...custom}
      style={
        {
          width: size.width ? `${size.width}px` : null, // 设置宽度, 判断是为了解决撤销不了的问题
          height: size.height ? `${size.height}px` : null // 设置高度， 判断是为了解决撤销不了的问题
        }
      }/>
    );
  },
  resize: {
    width: true, // 允许设置宽度
    height: true // 允许设置高度
  },
  model: {
    default: '绑定字段'
  }
});

visualConfig.registry('select', {
  label: '下拉框',
  preview: () => <ElSelect />,
  render: ({props, model, custom}) => (
    <ElSelect {...custom} key={(props.options || []).map((opt: any) => opt.value).join(',')} {...model.default}>
      {
        (props.options || []).map((opt: { label: string, value: string }, index: number) => (
          <ElOption label={opt.label} value={opt.value} key={index}/>
        ))
      }
    </ElSelect>
  ),
  props: {
    options: createEditorTableProp('下拉选项', {
      options: [
        { label: '显示值', field: 'label' }, // field 字段值相互不要重复
        { label: '绑定值', field: 'value' }, // field 字段值相互不要重复
        { label: '备注', field: 'comments' }, // field 字段值相互不要重复
      ],
      showKey: 'label' // 这个字段对应 options 数组中对象的 field 值
    })
  },
  model: {
    default: '绑定字段'
  }
});


visualConfig.registry('number-range', {
  label: '数字范围输入框',
  preview: () => <NumberRange />,
  render: ({model, size}) => {
    return (
      <NumberRange 
        style={{
            width: !!size.width ? `${size.width}px` : null, // 设置宽度, 判断是为了解决撤销不了的问题
            height: !!size.height ? `${size.height}px` : null // 设置高度， 判断是为了解决撤销不了的问题
        }}
        {
          ...{
            start: model.start.value,
            'onUpdate:start': model.start.onChange,
            end: model.start.end,
            'onUpdate:end': model.end.onChange
          }
        }
      />
    )
  },
  resize: {
    height: true // 允许设置高度
  },
  model: {
    start: '起始绑定字段',
    end: '结尾绑定字段'
  }
});

visualConfig.registry('image', {
  label: '图片',
  resize: {
    width: true,
     height: true
  },
  preview: () =>(
    <div style="text-align: center;">
      <div style="">
        <i class="el-icon-picture"></i>
      </div>
    </div>
  ),
  render: ({props, size}) => {
    return (
      <div style={
          {width: `${size.width || 100}px`, height: `${size.height || 100}px`}
        }
        class="visual-block-image"
      >
        <img src={props.url || require('./assets/img/default-img.jpg')} alt=""/>
      </div>
    );
  },
  props: {
    url: createEditorInputProp('地址')
  }
});