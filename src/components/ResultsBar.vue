<template>
  <div class="domain-graph">
    <Chart type="bar" :data="graphData" :options="options" />
    <article class="feedback-container">
      <h3 class="subtitle section-title"><span class="text">{{domainSet.title}}</span> <span class="score-display">{{domainSet.pcZeroStr3}}</span></h3>
      <div class="all" v-html="domainSet.feedbackText()"></div>
      <div v-for="facet in domainSet.facets" :key="['facet-fb',facet.key].join('-')" class="all">
        <h4 class="subtitle polarity-title"><span class="text">{{facet.title}}</span> <span class="score-display">{{facet.pcZeroStr3}}</span></h4>
        <article v-html="facet.feedbackText()"></article>
      </div>
    </article>
  </div>
</template>
<script lang="ts">
import { fetchSessionUser } from '@/api/methods';
import { AnalysisSet, DomainSet } from '@/api/models/analysis-set';
import { defaultBarPropSet, matchGraphColour } from '@/api/setings';
import { Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';


export default class ResultsBar extends Vue {
  @Prop({ default: () => new DomainSet() }) readonly domainSet: DomainSet = new DomainSet();

  domainKey = 'O';

  title = '';
  
  graphData = {
    labels: ['O', 'C', 'E', 'A', 'N'],
    datasets: [
      {
        ...defaultBarPropSet,
        data: [0, 0, 0, 0, 0]
      },
    ]
  }

  options = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    aspectRatio: 1.2
  }

  loaded = false;

  get user() {
    return fetchSessionUser();
  }

  created() {
    this.emitter.on('update-analysis', (sKey: string) => {
      if (sKey) {
        this.sync();
      }
    });
  }
  
  mounted() {
    setTimeout(this.init, 375);
  }

  init() {
    this.sync();
  }

  sync() {
    if (this.domainSet.facets.length > 0) {
      this.graphData.datasets = [];
      this.title = this.domainSet.title;
      const data: number[] = [];
      this.graphData.labels = this.domainSet.facets.map(fc => fc.title);
      this.domainSet.facets.forEach((fc, fi) => {
        data.push(fc.pc);
      })
      const backgroundColor = data.map((_,di) => matchGraphColour(di));
      const dataSet = {...defaultBarPropSet, backgroundColor, data };
      this.graphData.datasets.push(dataSet);
    }
    this.loaded = true;  
  }

  @Watch('analysisSets')
  changeAnalysisSets(newVal: AnalysisSet[] = []) {
    if (newVal instanceof Array) {
      this.init();
    }
  }
  
}
</script>
