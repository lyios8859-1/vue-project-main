import { useModel } from "@/packages/utils/useModel";
import { defineComponent } from "vue";
import './number-range.less';

export const NumberRange = defineComponent({
  props: {
    start: {
      type: String
    },
    end: {
      type: String
    }
  },
  emits: {
    'update:start': (val?: string) => val,
    'update:end': (val?: string) => val,
  },
  setup(props, { emit }) {
    const startModel = useModel(() => props.start, val => emit('update:start', val));
    const endModel = useModel(() => props.end, val => emit('update:end', val));
    
    return ()  => (
      <div class="number-range">
        <div><input type="text" v-model={startModel.value}/></div>
        <span>~</span>
        <div><input type="text" v-model={endModel.value}/></div>
      </div>
    );
  }
});