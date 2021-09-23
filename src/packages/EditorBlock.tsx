import { computed, defineComponent, inject, onMounted, PropType, ref } from "vue";
import { EditorConfig, VisualEditorBlockData } from "./visual-editor.utils";

import classnames from "./styles/EditorBlock.module.scss";

export default defineComponent({
  props: {
    block: {
      type: Object as PropType<VisualEditorBlockData>,
      required: true
    }
  },
  setup(props) {
    const styles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: props.block.zIndex
    }));

    const elRef = ref(null as null | {} as HTMLDivElement)
    onMounted(() => {
      const block = props.block;
      // 判断首次渲染组件时是否调整组件的位置
      if (Object.is(block.adjustPosition, true)) {
        const { offsetWidth, offsetHeight } = elRef.value;
        block.left = block.left - offsetWidth / 2;
        block.top = block.top - offsetHeight / 2;

        // 设置宽度高度
        block.width = offsetWidth;
        block.height = offsetHeight;

        block.adjustPosition = false;
      }
    })

    const config = inject<EditorConfig>('config');

    return () => {
      const component = config?.componentMap[props.block.key];
      const renderComponent = component?.render({});
      return (
        <div
          class={[classnames['editor-block'], props.block.focus && classnames['focus']]}
          style={styles.value}
          ref={elRef}
        >
          {renderComponent}
        </div>
      )
    }
  }
})