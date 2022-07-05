<template>
<div class="results-section-wrapper jungian">
  <div class="graph-wrapper octagonal">
    <Chart type="radar" :data="graphData" :options="options" class="octagon" />
    <div class="chart-overlay">
      <h5 v-for="polSet in rows" :key="['polarity-label', polSet.key].join('-')" class="domain-label poled" :class="polSet.key">
        <span class="inner">
          <span class="text" v-html="polSet.poleLabel"></span>
          <span class="score-display">{{polSet.pcPoledStr3}}</span>
        </span>
      </h5>
  </div>
  </div>  
  <div class="feedback-container">
    <h4>{{poleLetters}}</h4>
    <div v-for="polSet in rows" :key="['polarity-fb', polSet.key].join('-')" class="all">
      <h4 class="subtitle domain-title">
        <span class="text" v-html="polSet.poleLabel"></span>
        <span class="score-display">{{polSet.pcPoledStr}}</span>
      </h4>
      <div class="first" v-html="polSet.feedbackText()"></div>
      <div class="second" v-html="polSet.feedbackText2()"></div>
    </div>
  </div>
</div>
</template>
<script lang="ts">
import { fetchSessionUser } from '@/api/methods';
import { AnalysisSet, DomainSet } from '@/api/models/analysis-set';
import { defaultGraphPropSet, matchGraphColour } from '@/api/setings';
import { Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';


export default class ResultsOctagonal extends Vue {

  @Prop({ default: () => [] }) readonly analysisSets: AnalysisSet[] = [];

  surveyKey = 'jungian_options';
  
  graphData = {
    labels: ['I', 'E', 'S', 'N', 'F', 'T', 'J', 'P'],
    datasets: [
      {
        ...defaultGraphPropSet,
        data: [0, 0, 0, 0, 0, 0, 0, 0]
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

  get filteredSets(): AnalysisSet[] {
    return this.analysisSets.filter(as => as.key === this.surveyKey);
  }

  get firstSet(): AnalysisSet {
    return this.filteredSets.length > 0? this.filteredSets[0] : new AnalysisSet();
  }

  get rows(): DomainSet[] {
    return this.firstSet.getPolaritySets();
  }

  get poleLetters() {
    return this.rows.map(ps => ps.poleLetter).join('');
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
    if (this.filteredSets.length > 0) {
      this.graphData.datasets = [];
      this.filteredSets.forEach((anSet, ai) => {
        const data: number[] = [];
        const num = ai + 1;
        const label = anSet.hasName ? anSet.name : this.user.matchName(num);
        const dataSet = {...defaultGraphPropSet, label, data };
        const pData = anSet.getPolarityData();
        dataSet.data = pData.map(row => row.pc);
        this.graphData.labels = pData.map(row => row.title);
        const randIndex = Math.floor(Math.random() * 6 * 0.999999);
        const backgroundColor = matchGraphColour(randIndex);
        this.graphData.datasets.push({...dataSet, backgroundColor});
      })
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
