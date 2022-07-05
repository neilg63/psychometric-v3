<template>
  <form class="details user-form widget-pane aux-pane">
    <div class="row double long">
      <label for="email-field">Email</label>
      <InputText id="email-field" type="email" v-model="identifier" placeholder="Your email" />
    </div>
    <div class="row double long">
      <label for="nickname-field">Name</label>
      <InputText id="nickname-field" type="nickName" v-model="nickName" placeholder="Your name" title="Your name" />
    </div>
    <div class="row double">
      <label for="gender-field">Gender</label>
      <Dropdown v-model="gender" id="gender-field" :options="genderOpts" optionValue="key" optionLabel="title" placeholder="Select a gender" />
    </div>
    <div class="row double">
      <label for="dob-date-field">Date of birth</label>
      <InputText id="dob-date-field" type="date" v-model="dobDate" placeholder="Birth Date" />
    </div>
    <div class="row double">
      <label class="location right">
        <i class="pi pi-compass compass-icon"></i>
        <template v-if="hasLocation">
          <span class="lat">{{dmsLocation.lat}}</span>
          <span class="lat">{{dmsLocation.lng}}</span>
        </template>
        <template v-else>
          <i class="pi pi-question question-mark"></i>
        </template>
      </label>
      <Button @click="checkLocation">
        <i class="pi pi-map left"></i>
        <span class="text-label">Share location</span>
      </Button>
    </div>
    <div class="row submit-row">
      <Button v-if="showSave" @click="save">
        <i class="pi pi-save left"></i>
        <span class="text-label">Save</span>
      </Button>
      <slot></slot>
    </div>
  </form>
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { fromLocal, toLocal } from '@/api/localstore';
import { User } from '@/api/models/user';
import { GeoLoc } from '@/api/models/geo';
import { isNumeric, validDateTimeString, validEmail, validTimeString } from '@/api/validators';
import { fetchGeoLocation } from '@/api/geolocation';
import { savePublicUser } from '@/api/methods';
import { KeyValue } from '@/api/interfaces';
import { degAsDms } from '@/api/converters';
import { defaultGenderOptions } from '@/api/setings';


export default class Details extends Vue {
  
  @Prop({ default: () => [] }) readonly currentAnswers: Array<KeyValue> = [];

  user = new User();

  nickName = "";

  identifier = "";

  useragent = "";

  geo = new GeoLoc();

  gender = '-';

  dobDate = "";

  dobTime = "";

  created() {
    this.initDob();
  }

  mounted() {
    this.sync();
  }

  sync() {
    const stored = fromLocal('publicuser', 52 * 7 * 24 * 60 * 60);
    if (!stored.expired) {
      const { data } = stored;
      if (data instanceof Object) {
        this.user = new User(stored.data);
        this.identifier = this.user.identifier;
        this.nickName = this.user.nickName;
        this.gender = this.user.gender;
        if (validDateTimeString(this.user.dob)) {
          const [date, time] = this.user.dob.split("T");
          if (date) {
            this.dobDate = date;
          }
          if (time) {
            this.dobTime = time;
          }
        }
        if (this.user.geo instanceof GeoLoc) {
          this.geo = this.user.geo;
        }
      }
    }
    const geoStore = fromLocal("current_geo", 3 * 24 * 60 * 60);
    if (!geoStore.expired) {
      this.geo = new GeoLoc(geoStore.data);
      this.user.geo = this.geo;
    }
    this.useragent = navigator.userAgent;
  }

  get showSave() {
    return validEmail(this.identifier);
  }

  get dob() {
    const timeStr = validTimeString(this.dobTime) ? this.dobTime : "12:00:00";
    return [this.dobDate, timeStr].join("T");
  }

  get hasLocation() {
    return this.geo.lat !== 0 || this.geo.lng !== 0;
  }

  get dmsLocation() {
    return {
      lat: degAsDms(this.geo.lat, "lat", 0),
      lng: degAsDms(this.geo.lng, "lng", 0)
    };
  }

  get genderOpts() {
    return defaultGenderOptions;
  }

  initDob() {
    if (!validDateTimeString(this.dob)) {
      const currTs = new Date().getTime() - 30 * 365.25 * 24 * 60 * 60 * 1000;
      const refDt = new Date(currTs).toISOString();
      const dtStr = refDt.split("T").shift();
      if (typeof dtStr === "string") {
        this.dobDate = dtStr;
      } 
    }
  }

  save() {
    const prefs = this.currentAnswers.length > 0 ? this.currentAnswers : [];
    const edited = {
      nickName: this.nickName,
      identifier: this.identifier,
      dob: this.dob,
      useragent: this.useragent,
      gender: this.gender,
      geo: this.geo,
    }
    const user = new User(edited);
    const type = prefs.length > 0 ? prefs[0].type : '';
    toLocal("publicuser", user);
    savePublicUser(user, prefs, type).then(result => {
      if (result) {
        user.setId(result._id);
        this.user = user;
        this.emitter.emit('user-updated', true);
        this.emitter.emit('update-analysis', result);
      }
    });
  }

  checkLocation() {
    fetchGeoLocation((geo: any) => {
      if (geo instanceof Object) {
        const { lat, lng } = geo;
        if (isNumeric(lat) && isNumeric(lng)) {
          this.geo = new GeoLoc(geo);
          this.user.geo = this.geo;
          toLocal("current_geo", geo);
        }
      }
    })
  }
}
</script>