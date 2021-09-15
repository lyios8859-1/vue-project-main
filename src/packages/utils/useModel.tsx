import { ref, watch } from 'vue';

export function useModel<T> (getter: () => T, emitter: (val: T) => void) {
  const state = ref(getter()) as { value: T };

  watch(getter, val => {
    if (val !== state.value) {
      state.value = val;
    }
  });
  return {
    set value(val: T) {
      if (state.value !== val) {
        state.value = val;
        emitter(val);
      }
    },
    get value() {
      return state.value;
    },
  }
}


{/* <test-use-model v-model="value"></test-use-model> */}
// export const TestUseModel = defineComponent({
//   props: {
//     modelValue: { type: String }
//   },
//   emits: {
//     'update:modelValue': (val?: string) => true
//   },
//   setup (props, ctx) {
//     const model = useModel(() => props.modelValue, (val) => ctx.emit('update:modelValue', val));
//     console.log(model)
//     return () => (
//       <div>
//         自定义
//         <input type="text" v-model={model.value} />
//       </div>
//     );
//   }
// });