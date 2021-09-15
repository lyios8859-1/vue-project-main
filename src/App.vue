<template>
  <div class="app">
    <ly-editor
      v-model="jsonData"
      :config="visualConfig"
      :formData="formData"
      :customProps="customProps"
    >
      <!-- <template #aaaaa>
        <el-button v-if="formData.foo === 'aa'">自定义输入框</el-button>
        <el-tag>自定义标签</el-tag>
      </template> -->
    </ly-editor>
    <div>{{ formData }}</div>
    <!-- <NumberRange v-model:start="formData.minLevel" v-model:end="formData.maxLevel"></NumberRange> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { LyEditor } from "./packages/visual-editors";
import { visualConfig } from "./packages/visual-config";
// import { NumberRange } from './packages/components/number-range/number-range';

export default defineComponent({
  name: "App",
  components: {
    LyEditor,
    // NumberRange
  },
  data() {
    return {
      visualConfig,
      jsonData: {"container":{"height":500,"width":700},"blocks":[{"top":178,"left":129,"componentKey":"button","adjustPosition":false,"active":false,"focus":false,"zIndex":0,"width":70,"height":40,"hasResize":false,"props":{},"model":{}},{"top":299.5,"left":194,"componentKey":"input","adjustPosition":false,"active":false,"focus":false,"zIndex":0,"width":210,"height":41,"hasResize":false,"props":{},"model":{}},{"top":119,"left":372,"componentKey":"text","adjustPosition":false,"active":false,"focus":false,"zIndex":0,"width":32,"height":24,"hasResize":false,"props":{},"model":{}}]},
      formData: {
        username: "Tom",
        age: 23,
        minLevel: -99,
        maxLevel: 99,
      },
      customProps: {
        aaaaa: {
          onClick: () => {
            alert("自定义 props");
            // 实现组件的其他逻辑....
          },
        },
        mySelect: {
          onChange: (val: any) => {
            console.log('mySelect', val)
          }
        }
      },
    };
  },
});
</script>

<style lang="less">
html,
body {
  margin: 0;
  padding: 0;
}
</style>
