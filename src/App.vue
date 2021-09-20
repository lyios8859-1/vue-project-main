<template>
    <VisualEditor
        v-model="data"
        @dragstart="dragstart"
        @dragend="dragend"
    />
</template>

<script>
import { createApp, ref } from 'vue'

import VisualEditor from './packages';
import datas from './data.json';

const data = ref(datas);

export default {
    components: {
        VisualEditor
    },
    setup() {
        const dragstart = (v) => {
            console.log('dragstart', v)
        }
        const dragend = (v) => {
            console.log('dragend', v)
        }
        return {
            dragstart,
            dragend,
            data
        }
    }
}
</script>