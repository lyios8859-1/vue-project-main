import { defineComponent, PropType, computed, ref, onMounted, Slot } from 'vue';
import { BlockResize } from './components/block-resize/block-resize';
import { VisualEditorBlockData, VisualEditorConfig } from './visual-editors.utils';

export const VisualEditorBlock = defineComponent({
  name: 'VisualEditorBlock',
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>,
      requried: true
    },
    config: {
      type: Object as PropType<VisualEditorConfig>,
      requried: true
    },
    formData: {
      type: Object as PropType<Record<string, any>>,
      required: true
    },
    slots: {
      type: Object as PropType<Record<string, Slot | undefined>>,
      required: true
    },
    customProps: {
      type: Object as PropType<Record<string, any>>
    }
  },
  setup (props) {
    const styles = computed(() => ({
      top: `${props.block?.top}px`,
      left: `${props.block?.left}px`,
      zIndex: props.block?.zIndex,
    }));
    const el = ref({} as HTMLDivElement); // 这样写是能保证已经渲染了,如果不能保证 需这样写 ref(null as null | HTMLDivElement);
    const classes = computed(() => [
      'ly-editor__block',
      {
        'ly-editor__block__focus': props.block?.focus
      }
    ]);

    onMounted(() => {
      const block = props.block;
      if (block?.adjustPosition === true) {
        const { offsetHeight, offsetWidth } = el.value;
        // 保证拖拽的位置在鼠标点位置, 调整位置上下左右居于鼠标居中
        block.left = block.left - offsetWidth / 2;
        block.top = block.top - offsetHeight / 2;
        block.adjustPosition = false;

        block.width = offsetWidth;
        block.height = offsetHeight;
      }
    });

    return () => {
      const component = props.config?.componentMap[props.block!.componentKey];
      const formData = props.formData as Record<string, any>;

      let render: any;
      if (props.block?.slotName && props.slots[props.block?.slotName]) {
        render = props.slots[props.block?.slotName]!();
      } else {
        render = component?.render({
          props: props.block?.props || {},
          model: Object.keys(component.model || {}).reduce((prev, propName) => {
            const modelName = !props.block?.model ? null : props.block.model[propName];
  
            prev[propName] = {
              [propName === 'default' ? 'modelValue' : propName]: modelName ? formData[modelName] : null,
              [propName === 'default' ? 'onUpdate:modelValue' : 'onChange']: (val: any) => {
                modelName && (formData[modelName] = val);
              },
            };
            return prev;
          }, {} as Record<string, any>),
          size: props.block?.hasResize ? {
            width: props.block.width,
            height: props.block.height
          } : {},
          custom: !props.block?.slotName || !props.customProps ? {} : (props.customProps[props.block?.slotName] || {})
        });
  
      }

      const { width, height } = component?.resize || {};
      return (
        <div class={classes.value} style={styles.value} ref={el}>
          {render}
          {/*同时调整宽度和高度, 且是 focus（选中） 时*/}
          {props.block?.focus && (width || height) && <BlockResize block={props.block} component={component}/> }
        </div>
      )
    }
  }
});