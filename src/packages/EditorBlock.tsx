import { computed, defineComponent, inject, PropType } from "vue";
import { EditorConfig, VisualEditorBlockData } from "./visual-editor.utils";

import classnames from "./EditorBlock.module.scss";

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

    const config = inject<EditorConfig>('config');
    return () => {
      const component = config?.componentMap[props.block.key];
      const renderComponent = component?.render({});
      return (
        <div class={classnames['editor-block']} style={styles.value}>
          {renderComponent}
        </div>
      )
    }
  }
})