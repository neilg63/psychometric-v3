<template>
  <div class="results-container widget-pane aux-pane">
    <div class="sub-panes" :class="wrapperClasses">
      <ResultsRadar v-if="showBig5Set" :analysisSets="analysisSets" class="sub-pane" />
      <ResultsOctagonal v-if="showJungianSet" :analysisSets="analysisSets" class="sub-pane"/>
      <template v-if="showBig5Set">
        <template v-for="row in big5Set" :key="['big-5-chart', row.key].join('-')">
          <ResultsBar :domainSet="row" class="sub-pane rectangle" />
        </template>
      </template>
    </div>
    <Button v-if="showBottomNav" @click="goHome" class="home-trigger large-icon p-button-text" :text="true"><i class="pi pi-chevron-left"></i></Button>
  </div>
  
</template>
<script lang="ts">
import { fromLocal } from '@/api/localstore';
import { AnalysisSet, DomainSet } from '@/api/models/analysis-set';
import { defaultSurveyOptions } from '@/api/setings';
import { Options, Vue } from 'vue-class-component';
import ResultsRadar from './ResultsRadar.vue';
import ResultsOctagonal from './ResultsOctagonal.vue';
import ResultsBar from './ResultsBar.vue';
import { Prop, Watch } from 'vue-property-decorator';
import { notEmptyString } from '@/api/validators';

@Options({
  components: {
    ResultsRadar,
    ResultsBar,
    ResultsOctagonal
  },
})
export default class ResultsContainer extends Vue {

  @Prop({ default: 'big5' }) readonly mode: string = 'big5';

  @Prop({ default: '' }) readonly viewMode: string = '';

  currentTab = 'overview';

  analysisSets: AnalysisSet[] = [];

  get big5Set(): DomainSet[] {
    const sType = this.matchType('big5');
    const mSet = this.analysisSets.find(so => so.key === sType.key);
    const rows: DomainSet[] = mSet instanceof Object ? mSet.getDomainSets() : [];
    return rows;
  }

  get jungianSet(): DomainSet[] {
    const sType = this.matchType('jungian');
    const mSet = this.analysisSets.find(so => so.key === sType.key);
    const rows: DomainSet[] = mSet instanceof Object ? mSet.getPolaritySets() : [];
    return rows;
  }

  get showBig5Set() {
    return this.mode === 'big5';
  }

  get showJungianSet() {
    return this.mode === 'jungian';
  }

  created() {
    this.emitter.on('analysis-updated', (sType: string) => {
      if (notEmptyString(sType)) {
        setTimeout(this.sync, 375);
      }
    });
    this.emitter.on('show-domain-results', (domain: string) => {
      this.currentTab = domain;
    })
    this.emitter.on('next', this.next);
    this.emitter.on('prev', this.prev);
    this.emitter.on('escape', this.goHome);
  }

  mounted() {
    setTimeout(this.sync, 500);
  }
  
  sync() {
    this.analysisSets = [];
    defaultSurveyOptions.forEach(so => {
      const aKey = [so.key, 'analysis'].join('-');
      const stored = fromLocal(aKey, 7 * 24 * 60 * 60);
      if (!stored.expired) {
        this.analysisSets.push(new AnalysisSet(so.key, stored.data));
      }
    })
  }
  matchType(mode = '') {
    const mi = defaultSurveyOptions.findIndex(so => so.mode === mode);
    const index = mi < 0? 0 : mi;
    return defaultSurveyOptions[index];
  }

  nextPrev(forward = true) {
    if (this.viewMode === 'results') {
      const lastIndex = this.tabOptions.length - 1;
      const currIndex = this.tabOptions.findIndex(to => to.key === this.currentTab)
      const offset = forward? 1 : -1;
      const targetIndex = currIndex >= 0 ? currIndex + offset : 0;
      const nextIndex = targetIndex < 0 ? lastIndex : targetIndex > lastIndex ? 0 : targetIndex;
      this.currentTab = this.tabOptions[nextIndex].key;
    }
  }

  next() {
    this.nextPrev(true);
  }

  prev() {
    this.nextPrev(false);
  }

  goHome() {
    this.currentTab = 'overview';
  }

  get tabOptions() {
    const radarTitle = this.mode === 'big5' ? "Pentagon" : "Octagon";
    const start = { key: 'overview', title: radarTitle };
    const midEls = this.mode === 'big5' ? this.big5Set.map(dm => {
      return {
        key: dm.domain,
        title: dm.title,
      }
    }) : []
    return [
      start,
      ...midEls,
    ]
  }

  get showBottomNav() {
    return this.tabOptions.length > 2 && this.currentTab !== "overview";
  }

  get wrapperClasses() {
    const cls = [['show',this.currentTab].join('-')];
    const index = this.tabOptions.findIndex(to => to.key === this.currentTab);
    if (index > 0) {
      cls.push(['offset', index].join('-'));
    }
    return cls;
  }

  @Watch('mode')
  changeMode(newVal = '') {
    this.sync();
  }

}
</script>
