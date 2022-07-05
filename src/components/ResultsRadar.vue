<template>
<div class="results-section-wrapper big5">
  <div class="graph-wrapper pentagonal">
    <Chart type="radar" :data="graphData" :options="options" class="pentagon" />
    <div class="chart-overlay">
      <h5 v-for="domSet in rows" :key="['polarity-label', domSet.key].join('-')" class="domain-label unidir" :class="domSet.key" v-tooltip.right="domainTooltip(domSet)" @click="showDomainResults(domSet.domain)">
        <span class="inner">
          <span class="text" v-html="domSet.title"></span>
          <span class="score-display">{{domSet.pcZeroStr3}}</span>
        </span>
      </h5>
    </div>
  </div>
  <div class="feedback-container">
    <div v-for="domSet in rows" :key="['domain-fb', domSet.key].join('-')" class="all">
      <h4 class="subtitle domain-title domain-link" v-tooltip.bottom="domainTooltip(domSet)" @click="showDomainResults(domSet.domain)">
        <span class="text" v-html="domSet.title"></span>
        <span class="score-display">{{domSet.pcZeroStr}}</span>
      </h4>
      <div class="feedback">
        <span class="text-wrapper inline" v-html="domSet.feedbackText()"></span>
        <i class="pi pi-arrow-right more-link" v-tooltip.top="domainTooltip(domSet)" @click="showDomainResults(domSet.domain)"></i>
      </div>
    </div>
  </div>
</div>
</template>
<script lang="ts">
import { fetchSessionUser } from '@/api/methods';
import { AnalysisSet, DomainSet } from '@/api/models/analysis-set';
import { big5Categories, defaultGraphPropSet, matchGraphColour } from '@/api/setings';
import { notEmptyString } from '@/api/validators';
import { Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';


export default class ResultsRadar extends Vue {

  @Prop({ default: () => [] }) readonly analysisSets: AnalysisSet[] = [];

  @Prop({ default: 'big5' }) readonly mode: string = 'big5';

  surveyKey = 'faceted_personality_options';
  
  graphData = {
    labels: ['O', 'C', 'E', 'A', 'N'],
    datasets: [
      {
        ...defaultGraphPropSet,
        data: [0, 0, 0, 0, 0]
      },
    ]
  }

  options = {
    plugins: {
      legend: {
        display: false,
        /* labels: {
          color: '#495057'
        } */
      }
    },
    scales: {
      r: {
        pointLabels: {
          color: '#495057',
        },
        grid: {
          color: '#ebedef',
        },
        angleLines: {
          color: '#ebedef'
        },
        suggestedMin: 0,
        suggestedMax: 100,
      }
    }
  }

  loaded = false;

  get user() {
    return fetchSessionUser();
  }

  get letters() {
    return big5Categories.map(ct => ct.key);
  }

  get filteredSets(): AnalysisSet[] {
    return this.analysisSets.filter(as => as.key === this.surveyKey);
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
    if (notEmptyString(this.user.nickName)) {
      this.graphData.datasets[0].label = this.user.nickName;
    }
    this.graphData.labels = big5Categories.map(ct => ct.title);
    this.sync();
  }

  sync() {
    if (this.filteredSets.length > 0) {
      this.graphData.datasets = [];
      this.filteredSets.forEach((anSet, ai) => {
        const data: number[] = [];
        const num = ai + 1;
        const label = anSet.hasName ? anSet.name : this.user.matchName(num);
        const dataSet = {...defaultGraphPropSet, label, data };
        big5Categories.forEach(ct => {
          if (anSet.domainMap.has(ct.key)) {
            const item = anSet.domainMap.get(ct.key);
            if (item instanceof Object) {
              if (typeof item.pc === "number") {
                dataSet.data.push(item.pc);
              }
            }
          }
        });
        const randIndex = Math.floor(Math.random() * 6 * 0.999999);
        const backgroundColor = matchGraphColour(randIndex);
        this.graphData.datasets.push({...dataSet, backgroundColor});
      })
    }
    this.loaded = true;
  }

  get firstSet(): AnalysisSet {
    return this.filteredSets.length > 0? this.filteredSets[0] : new AnalysisSet();
  }

  get rows(): DomainSet[] {
    return this.firstSet.getDomainSets();
  }

  showDomainResults(domain = '') {
    if (notEmptyString(domain)) {
      this.emitter.emit('show-domain-results', domain);
    }
  }

  domainTooltip(domSet: DomainSet) {
    const subTitle = domSet.title.toLowerCase();
    return {
      value: `View full ${subTitle} details`,
      class: 'wide-tip'
    };
  }

  @Watch('analysisSets')
  changeAnalysisSets(newVal: AnalysisSet[] = []) {
    if (newVal instanceof Array) {
      this.init();
    }
  }
  
}
</script>
