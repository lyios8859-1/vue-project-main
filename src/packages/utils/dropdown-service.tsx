import { computed, createApp, defineComponent, getCurrentInstance, inject, onBeforeUnmount, onMounted, PropType, provide, reactive, ref } from "vue";
import { defer } from './defer';

import './dropdown-service.scss';

interface DropdownServiceOption {
  reference: MouseEvent | HTMLElement,
  content: () => JSX.Element
}

const DropdownServicePrivoder = (() => {
  const DROPDOWN_SERVICE_PROVIDER = '@@DROPDOWN_SERVICE_PROVIDER';
  return {
    provide: (handler: { onClick: () => void }) => provide(DROPDOWN_SERVICE_PROVIDER, handler),
    inject: () => inject(DROPDOWN_SERVICE_PROVIDER) as { onClick: () => void }
  }
})();


const ServiceComponent = defineComponent({
  props: {
    option: {
      type: Object as PropType<DropdownServiceOption>,
      required: true
    }
  },
  setup (props) {

    const vm = getCurrentInstance();
    const el = ref({} as HTMLElement);

    const state = reactive({
      option: props.option,
      showFlag: false,
      top: 0,
      left: 0,
      mounted: (() => { // 解决首页页面加载，右键菜单没有动画的情况
        const dfd = defer();
        onMounted(() => setTimeout(dfd.resolve));
        return dfd.promise;
      })()
    });
    const methods = {
      show: async () => {
        await state.mounted;
        state.showFlag = true;
      },
      hide: () => {
        state.showFlag = false;
      }
    };

    const service = (option: DropdownServiceOption) => {
      state.option = option;
      if ('addEventListener' in option.reference ) {
        const { top, left, height } = option.reference.getBoundingClientRect();
        state.left = left;
        state.top = top + height;
      } else {
        const { clientX, clientY } = option.reference;
        state.left =  clientX;
        state.top = clientY;
      }
      methods.show();
    };

    const classes = computed(() => ([
      'dropdown-service',
      {
        'dropdown-service-show': state.showFlag
      }
    ]));

    const style = computed(() => ({
      top: `${state.top}px`,
      left: `${state.left}px`,
    }));

    Object.assign(vm?.proxy, { service });
    const onMouseDownDocument = (e: MouseEvent) => {
      // 判断点击当前
      if (!el.value.contains(e.target as HTMLElement)) {
        methods.hide();
      }
    };
    onMounted(() => {
      document.addEventListener('mousedown', onMouseDownDocument, true); // 监听捕获事件
    });
    onBeforeUnmount(() => document.removeEventListener('mousedown', onMouseDownDocument, true));

    DropdownServicePrivoder.provide({
      onClick: methods.hide
    });
    return () => (
      <div class={classes.value} style={style.value} ref={el}> 
        {state.option.content()}
      </div>
    );
  }
});

export const DropdwonOption = defineComponent({
  props: {
    label: { type: String },
    icon: { type: String }
  },
  emits: {
    click: (e: MouseEvent) => true
  },
  setup (props, { emit }) {
    const { onClick: dropdownClickHandler } = DropdownServicePrivoder.inject();

    const handler = {
      onClick: (e: MouseEvent) => {
        emit('click', e);
        dropdownClickHandler();
      }
    };
    return() => (
      <div class="dropdown-service__option" onClick={handler.onClick}>
        <i class={`iconfont ${props.icon}`} />
        <span>{props.label}</span>
      </div>
    )
  }
});

export const $$dropdown = (() => {
  let ins: any;
  return (option: DropdownServiceOption) => {
    if (!ins) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const app = createApp(ServiceComponent, { option });
      ins = app.mount(el);
    }
    ins.service(option);
  }
})();