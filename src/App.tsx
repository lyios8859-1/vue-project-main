import { createApp, ref } from 'vue'

import VisualEditor from './packages';
import { VisualEditorModelValue } from './packages/visual-editor.utils';
import datas from './data.json';
import 'element-plus/dist/index.css';
const d = ref(datas);
const app = createApp(<VisualEditor
  v-model={d.value as VisualEditorModelValue}
/>);

app.mount('#app');