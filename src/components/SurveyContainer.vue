<template>
  <section class="survey-container widget-pane" :class="wrapperClasses">
    <div v-if="hasQuestions" class="question">
      <p class="prompt">{{prompt}}</p>
      <div class="radio-selectors column">
        <div v-for="opt in options" :key="opt.key" class="p-field-radiobutton option row">
          <RadioButton :id="opt.itemKey('id')" name="value" :value="opt.value" v-model="currValue" />
          <label :for="opt.itemKey('id')">{{opt.title}}</label>
        </div>
      </div>
      <i class="pi pi-arrow-circle-right primary-trigger right-half" @click="next"></i>
      <nav class="progress row">
        <Button @click="prev" class="large-icon p-button-text anchored left-end"><i class="pi pi-arrow-circle-left"></i></Button>
        <Button v-if="hasUnanswered" @click="stepBack" v-tooltip.top="prevUnsweredTooltip" class="p-button-text anchored inner-bt left-2"><i class="pi pi-step-backward"></i></Button>
        <em class="question-num"><span class="mini-label">Question</span><span class="num-value">{{questionNum}}</span></em>
        <Slider v-model="index" :range="false" :min="0" :max="lastIndex" class="nav-slider" />
        <div class="completed">
          <span class="num-value">{{numAnswersValue}}</span>
          <span class="mini-label">answered</span>
        </div>
        <Button v-if="hasUnanswered" @click="stepForward" v-tooltip.top="nextUnsweredTooltip" class="p-button-text anchored inner-bt right-2"><i class="pi pi-step-forward"></i></Button>
        <Button @click="next" class="large-icon p-button-text anchored right-end" :text="true"><i class="pi pi-arrow-circle-right"></i></Button>
      </nav>
      <div v-if="showSubmit" class="submit-row">
        <Button @click="submitAnswers">{{submitLabel}}</Button>
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { fetchPreferenceOptions, fetchSessionUser, savePublicUser, testFacetedSurveyAnswers } from '@/api/methods';
import { Question } from '@/api/models/question';
import { Option } from '@/api/models/option';
import { Answer } from '@/api/models/answer';
import { fromLocal, toLocal } from '@/api/localstore';
import { isNumeric, notEmptyString } from '@/api/validators';
import { smartCastInt } from '@/api/converters';
import { defaultSurveyOptions } from '@/api/setings';
import { randomInt } from '@/api/helpers';

@Options({
  emits: ['update']
})
export default class SurveyContainer extends Vue {
  @Prop({ default: 'faceted_personality_options' }) readonly surveyKey: string = '';
  @Prop({ default: false }) readonly hasUser: boolean = false;
  @Prop({ default: '' }) readonly viewMode: string = '';

  items: Question[] = [];

  index = 0;

  currValue = 0;

  answers: Answer[] = [];

  options: Option[] = [];

  switching = false;

  created() {
    this.emitter.on('prefill', (isNew: boolean) => {
      this.prefillAnswers(isNew);
    });
    this.emitter.on('submit-results', this.submitAnswers);
    this.emitter.on('update-analysis', (result: any) => {
      this.updateAnalysis(result);
    })
    this.emitter.on('next', this.next);
    this.emitter.on('prev', this.prev);
  }

  mounted() {
    setTimeout(this.init, 250);
  }

  init() {
    this.options = [];
    this.items = [];
    this.index = 0;
    if (!this.switching) {
      this.switching = true;
      fetchPreferenceOptions(this.surveyKey).then(data => {
        if (data.items instanceof Array) {
          this.items = data.items.map((item: any) => new Question(item));

          if (data.options instanceof Array) {
            this.options = data.options.filter((op: any) => op instanceof Object).map((op: any, index: number) => {
              const { values } = op;
              const title = values[0].text;
              const value = index + 1;
              return new Option({ title, value })
            });
          }
          setTimeout(this.sync, 250);
        }
      });
    }
    
  }

  sync() {
    this.answers = [];
    this.switching = true;
    const stored = fromLocal(this.answersStoreKey, 7 * 24 * 60 * 60);
    this.currValue = 0;
    if (!stored.expired) {
      const { data } = stored;
      if (data instanceof Array) {
        this.answers = data.map(ans => new Answer(ans));
        const indexStore = fromLocal(this.indexStoreKey, 3 * 60 * 60);
        if (!indexStore.expired) {
          if (isNumeric(indexStore.data)) {
            this.index = smartCastInt(indexStore.data);
            setTimeout(this.syncCurrentAnswer, 125);
          }
        } else {
          this.index = 0;
          this.syncCurrentAnswer();
        }
      }
    }
    setTimeout(() => {
      this.switching = false;
      this.updateAnswers();
    }, 625);
  }

  syncCurrentAnswer() {
    if (this.currentAnswerIndex >= 0 && this.currentAnswerIndex < this.answers.length) {
      this.currValue = this.answers[this.currentAnswerIndex].value
    }
  }

  get surveyOptions() {
    return defaultSurveyOptions;
  }

  get surveyIndex() {
    return this.surveyOptions.findIndex(sv => sv.key === this.surveyKey);
  }

  get surveyType() {
    return this.surveyIndex >= 0? this.surveyOptions[this.surveyIndex].type : '';
  }

  get title() {
    return this.surveyIndex >= 0? this.surveyOptions[this.surveyIndex].title : 'Survey Widget';
  }

  get prompt() {
    return this.currentQuestion.prompt;
  }

  get currKey() {
    return this.currentQuestion.key;
  }

  get currDomain() {
    return this.currentQuestion.domain;
  }

  get facetNum() {
    return this.currentQuestion.subdomain;
  }

  get questionNum(): number {
    return this.index + 1;
  }

  get questionRefNum(): number {
    return this.isJungian ? this.facetNum : this.questionNum;
  }

  get currType(): string {
    return this.currDomain.length === 2 ? "jungian" : "big5";
  }

  get prevUnsweredTooltip() {
    return this.numUnanswered > 0 ? `Go to the previous unanswered question` : `Go back to the first question`;
  }

  get nextUnsweredTooltip() {
    return this.numUnanswered > 0 ? `Go to the next unanswered question` : `Go to the last question`;
  }

  get isJungian(): boolean {
    return this.currType === 'jungian';
  }

  get hasQuestions(): boolean {
    return this.items.length > 0;
  }

  get numQuestions(): number {
    return this.items.length;
  }

  get lastIndex(): number {
    return this.numQuestions - 1;
  }

  get currentQuestion() {
    if (this.hasQuestions && this.index < this.numQuestions) {
      return this.items[this.index];
    } else {
      return new Question();
    }
  }

  get currentAnswerIndex() {
    return this.answers.findIndex(item => item.key === this.currKey);
  }

  get numAnswers(): number {
    return this.filteredAnswers.length;
  }

  get numAnswersValue(): string {
    return `${this.numAnswers} of ${this.numQuestions}`;
  }

  get numUnanswered() {
    const numLeft = this.numQuestions - this.numAnswers;
    return numLeft >= 0 ? numLeft : 0;
  }

  get hasUnanswered() {
    return this.numUnanswered > 0;
  }

  get answersStoreKey() {
    return [this.surveyKey, 'answers'].join('-');
  }

  get indexStoreKey() {
    return [this.surveyKey, 'index'].join('-');
  }

  get filteredAnswers() {
    return this.answers.filter(ans => notEmptyString(ans.key) && ans.value > 0 && this.questionKeys.includes(ans.key));
  }

  get showSubmit() {
    return this.filteredAnswers.length === this.numQuestions && this.numQuestions > 0;
  }

  get wrapperClasses() {
    const cls = [this.surveyType, this.surveyKey.replace(/_/g,'-')];
    const dmStr = this.currentQuestion.domain; 
    if (notEmptyString(dmStr)) {
      cls.push(['domain', dmStr.toLowerCase()].join('-'))
    }
    return cls;
  }

  get analysisKey() {
    return [this.surveyKey, 'analysis'].join('-');
  }

  get submitLabel() {
    return this.hasUser ? 'Show Results' : 'Add details'
  }

  updateAnswers() {
    this.$emit('update', {
      answers: this.answers.filter(ans => notEmptyString(ans.key)),
      total: this.numQuestions,
      type: this.surveyType,
      key: this.surveyKey
    })
  }

  nextPrev(prevMode = false) {
    if (this.viewMode === 'survey') {
      if (prevMode) {
        if (this.index > 0) {
          this.index -= 1;
        }
      } else {
        if (this.index < this.lastIndex) {
          this.index += 1;
        } else {
          this.emitter.emit('show-user', true);
        }
      }
    }
  }

  get answerKeys() {
    return this.answers.filter(ans => ans.key.length > 1).map(ans => ans.key);
  }

  get questionKeys() {
    return this.items.map(q => q.key);
  }

  stepBack() {
    const head = this.items.slice(0, this.index - 1);
    const revIndex = head.reverse().findIndex(q => this.answerKeys.includes(q.key) === false);
    const prevUnansweredIndex = revIndex >= 0 ? head.length - revIndex : -1;
    this.index = prevUnansweredIndex >= 0 ? prevUnansweredIndex : 0;
  }

  stepForward() {
    const tail = this.items.slice(this.index);
    const nextUnansweredIndex = tail.findIndex(q => this.answerKeys.includes(q.key) === false)
    this.index = nextUnansweredIndex >= 0 ? nextUnansweredIndex + this.index : this.items.length - 1;
  }

  next() {
    this.nextPrev(false);
  }

  prev() {
    this.nextPrev(true);
  }

  prefillAnswers(isNew = false) {
    this.items.forEach(item => {
      const newValue = randomInt();
      const refAnswerIndex = this.answers.findIndex(ans => ans.key === item.key);
      const answer = new Answer({...item, value: newValue});
      if (refAnswerIndex < 0) {
        this.answers.push(answer);
      } else if (!isNew) {
        this.answers[refAnswerIndex] = answer;
      }
    });
    setTimeout(() => {
      toLocal(this.answersStoreKey, this.answers);
      this.index = this.items.length -1;
    }, 375);
  }

  submitAnswers() {
    if (this.hasUser) {
      const user = fetchSessionUser();
      savePublicUser(user, this.filteredAnswers, this.surveyType).then(result => {
        if (result.valid) {
          this.updateAnalysis(result, false);
        }
      });
      this.emitter.emit('show-results', true);
    } else {
      this.emitter.emit('show-user', true);
    }
  }

  updateAnalysis(result: any = null, allowUpdateAnswers = false) {
    const entries = result instanceof Object ? Object.entries(result) : [];
    let updateAnswers = false;
    let sKey = '';
    entries.forEach(([key, data]) => {
      if (data instanceof Object) {
        switch (key) {
          case 'analysis':
            toLocal(this.analysisKey, data);
            updateAnswers = allowUpdateAnswers;
            break;
          case 'facetedAnalysis':
            sKey = ['faceted_personality_options', 'analysis'].join('-');
            toLocal(sKey, data);
            updateAnswers = sKey === this.analysisKey && allowUpdateAnswers;
            break;
          case 'jungianAnalysis':
            sKey = ['jungian_options', 'analysis'].join('-');
            toLocal(sKey, data);
            updateAnswers = sKey === this.analysisKey && allowUpdateAnswers;
            break;
        }
      }
    })
    if (updateAnswers) {
      this.updateAnswers();
      this.emitter.emit('analysis-updated', this.surveyType);
    }
  }

  @Watch('index')
  changeIndex() {
    if (this.currentAnswerIndex < 0) {
      this.currValue = 0;
    } else {
      this.currValue = this.answers[this.currentAnswerIndex].value;
    }
    if (!isNaN(this.index)) {
      toLocal(this.indexStoreKey, this.index, "int");
    }
  }

  @Watch('surveyKey')
  changeSurveyKey(newVal = '') {
    if (notEmptyString(newVal)) {
      this.init();
    }
  }

  @Watch('currValue')
  changeCurrValue(newValue = 0) {
    if (newValue > 0 && !this.switching) {
      const answer = new Answer({...this.currentQuestion, value: newValue});
      if (this.currentAnswerIndex < 0) {
        this.answers.push(answer);
      } else {
        this.answers[this.currentAnswerIndex] = answer;
      }
      toLocal(this.answersStoreKey, this.answers);
      this.updateAnswers();
    }
  }

}
</script>
