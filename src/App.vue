<template>
  <div class="psychometric-widget widget" :class="wrapperClasses">
    <i class="pi fullscreen-toggle" :class="fullScreenIconClasses" v-tooltip.left="toggleTooltip" @click="toggleFullScreenMode"></i>
    <form class="options">
      <SelectButton v-if="enableModeSelector" v-model="currentSurvey" :options="surveyOptions" optionLabel="title" dataKey="key" :multiple="false" class="survey-selector" />
      <SelectButton v-model="viewMode" :options="viewModes" :multiple="false" optionLabel="title" optionValue="key" class="mode-selector">
        <template #option="slotProps">
          <i class="pi" :class="slotProps.option.icon" v-tooltip.bottom="slotProps.option.title"></i>
        </template>
      </SelectButton>
    </form>
    <form class="settings aux-pane">
      <Button @click="prefillAnswers">
        <i class="pi pi-star"></i>
        <span class="text-label">{{generateLabel}}</span>
      </Button>
      <Button @click="resetData">
        <i class="pi pi-trash"></i>
        <span class="text-label">{{resetLabel}}</span>
      </Button>
    </form>
    <SurveyContainer @update="surveyUpdate" :surveyKey="currentSurveyKey" :hasUser="hasUserDetails" :viewMode="viewMode" />
    <Details :currentAnswers="currentAnswers" :viewMode="viewMode">
      <i class="pi pi-cog settings-button" @click="enableSettings"></i>
    </Details>
    <ResultsContainer :mode="currentSurveyMode" :viewMode="viewMode" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import SurveyContainer from './components/SurveyContainer.vue';
import ResultsContainer from './components/ResultsContainer.vue';
import Details from './components/Details.vue';
import { KeyValue } from './api/interfaces';
import { defaultSurveyOptions, defaultViewOptions } from './api/setings';
import { Watch } from 'vue-property-decorator';
import { notEmptyString } from './api/validators';
import { fetchSessionUser } from './api/methods';
import { clearLocal, fromLocal, toLocal } from './api/localstore';
import { toggleWidgetFullscreen, exitFullScreen, fetchSurveyEnabledSurveyModes } from './api/dom';

@Options({
  components: {
    SurveyContainer,
    Details,
    ResultsContainer
  },
})
export default class App extends Vue {

  surveyCompleted = false;

  hasUserDetails = false;

  currentSurvey = defaultSurveyOptions[0];

  currentAnswers: KeyValue[] = [];

  showResults = false;
  showUserForm = false;
  showSettings = false;
  viewMode = 'survey';
  prevViewMode = 'survey';
  fullScreen = false;
  enableModeSelector = false;
  enabledModes = ['big5', 'jungian'];

  created() {
    this.emitter.on('user-updated', () => {
      this.hasUserDetails = true;
      this.viewMode = this.surveyCompleted? 'results' : 'survey';
    });
    this.emitter.on('show-user', () => {
      this.showUserForm = true;
      this.showSettings = false;
      this.showResults = false;
      this.viewMode = 'user';
    });
    this.emitter.on('show-results', () => {
      this.showUserForm = false;
      this.showSettings = false;
      this.showResults = true;
      this.viewMode = 'results';
    });
    this.enabledModes = fetchSurveyEnabledSurveyModes();
    if (this.enabledModes.length > 1) {
      this.enableModeSelector = true;
    }
    if (this.enabledModes.length > 0) {
      const matchedMode = defaultSurveyOptions.find(so => so.mode ===this.enabledModes[0]);
      if (matchedMode) {
        this.currentSurvey = matchedMode;
      }
    }
    const user = fetchSessionUser()
    if (user.hasIdentifier) {
      this.hasUserDetails = true;
    }
    this.emitter.on('escape', () => {
      switch (this.viewMode) {
        case "user":
        case "settings":
          this.viewMode = this.prevViewMode;
          break;
      }
    });
    document.addEventListener("fullscreenchange", (e) => {
      if (!document.fullscreenElement) {
        this.disableFullScreen();
      }
    });
    window.addEventListener("keydown", this.handleKeyDown);
    this.initSurveyTab();
    setTimeout(this.initViewModeTab, 2000);
  }

  initSurveyTab() {
    const storedSk = fromLocal('current_survey', 24 * 60 * 60);
    if (!storedSk.expired) {
      const so = this.surveyOptions.find(so => so.key === storedSk.data);
      if (so instanceof Object && this.enabledModes.includes(so.mode)) {
        this.currentSurvey = so;
      }
    }
  }

  initViewModeTab() {
    const storedVm = fromLocal('view_mode', 24 * 60 * 60);
    if (!storedVm.expired) {
      if (this.viewModes.some(vm => vm.key === storedVm.data)) {
        this.viewMode = storedVm.data;
      }
    }
  }

  surveyUpdate(res: any = null) {
    if (res instanceof Object) {
      const { answers, total, type } = res;
      if (answers.length > 0) {
        this.surveyCompleted = answers.length === total;
        this.currentAnswers = answers.map((ans: any) => {
          const { key, value } = ans;
          return { key, value, type };
        });
      }
    }
  }

  handleKeyDown(e: any) {
    switch (e.which) {
      case 37:
        this.emitter.emit("prev", true);
        break;
      case 39:
        this.emitter.emit("next", true);
        break;
      case 27:
        this.emitter.emit("escape", true);
        break;
    }
  }

  get surveyOptions() {
    return defaultSurveyOptions;
  }

  get viewModes() {
    return defaultViewOptions.filter(op => op.show !== "completed" || this.surveyCompleted);
  }

  get currentSurveyKey() {
    return this.currentSurvey instanceof Object? this.currentSurvey.key : '';
  }

  get currentSurveyMode() {
    return this.currentSurvey instanceof Object? this.currentSurvey.mode : '';
  }

  get surveyType() {
    return this.currentSurvey instanceof Object? this.currentSurvey.type : '';
  }

  get fullScreenIconClasses() {
    return this.fullScreen ? "pi-window-minimize" : "pi-window-maximize";
  }

  get wrapperClasses() {
    const cls: string[] = [];
    if (this.surveyCompleted) {
      cls.push('survey-completed');
    }
    if (this.showResults) {
      cls.push('show-results');
    }
    if (this.showSettings) {
      cls.push('show-settings');
    }
    if (this.showUserForm) {
      cls.push('show-user-form');
    }
    return cls;
  }

  get generateLabel() {
    return this.surveyCompleted ? 'Re-generate answers' : 'Generated random answers';
  }

  get toggleTooltip() {
    return this.fullScreen ? `Exit fullscreen` : `Fullscreen mode`;
  }

  toggleSettings() {
    this.showResults = !this.showResults;
  }

  prefillAnswers() {
    this.emitter.emit('prefill', this.surveyCompleted);
    this.showSettings = false;
  }

  resetData() {
    this.currentAnswers = [];
    for (const k of ['answers', 'analysis', 'index']) {
      const sk = [this.currentSurveyKey, k].join('-');
      clearLocal(sk);
    }
  }

  enableSettings() {
    this.viewMode = 'settings';
  }

  toggleFullScreenMode() {
    this.fullScreen = !this.fullScreen;
    toggleWidgetFullscreen();
  }

  disableFullScreen() {
    this.fullScreen = false;
    exitFullScreen();
  }

  get resetLabel() {
    return `Reset current data`
  }

  @Watch('currentSurveyKey')
  changeCurrentSurveyKey(newVal: any = null) {
    if (notEmptyString(newVal)) {
      toLocal('current_survey', newVal);
      switch (this.viewMode) {
        case 'user':
        case 'settings':
          this.showUserForm = false;
          this.showResults = false;
          this.viewMode = 'survey';
          break;
      }
    }
  }

  @Watch('viewMode')
  changeViewMode(newVal: string, prevVal: string) {
    toLocal('view_mode', newVal);
    switch (newVal) {
      case "user":
        this.showUserForm = true;
        this.showResults = false;
        this.showSettings = false;
        break;
      case "results":
        this.showUserForm = false;
        this.showResults = true;
        this.showSettings = false;
        this.emitter.emit('analysis-updated', this.surveyType);
        break;
      case "settings":
        this.showSettings = true;
        this.showUserForm = false;
        this.showResults = false;
        break;
      default:
        this.showUserForm = false;
        this.showResults = false;
        this.showSettings = false;
        break;
    }
    this.prevViewMode = prevVal;
  }
}
</script>

<style lang="scss">
@import "./styles/main.scss";
</style>
