/**------------------------------------------------------------------------------
 *
 *  @file   app.js
 *  @brief  TFL Bus Times (58 and 158)
 *
 *----------------------------------------------------------------------------*/

const handleFetchError = response => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

// App
let app = new Vue({
  el: '#app',
  data: {
    counter: 0,
    data: {},
    buses: {},
    endpoints: {
      'BHR158': '158/Arrivals/490007246N?direction=inbound',   // towards Blackhorse Road / Walthamstow
      'BHR58': '58/Arrivals/490007246N?direction=outbound',    // towards Blackhorse Road / Walthamstow
      'STR158': '158/Arrivals/490007246S?direction=outbound',  // towards Stratford
      'STR58': '58/Arrivals/490007246S?direction=inbound',     // towards Stratford
    },
    timer: 0,
    refreshTimer: 0,
  },
  methods: {
    startTimer: function() {
      this.timer = setInterval(() => {
        this.tick();
        this.counter++;
        if (this.counter >= 60) {
          this.getBusData();
          this.counter = 0;
        }
      }, 1000);
    },
    tick: function() {
      for (const [id, data] of Object.entries(this.data)) {
        var now = new Date().getTime();
        var notMissed = data.filter(bus => new Date(bus.expectedArrival) > now);
        var soonest = notMissed.sort((a, b) => new Date(a.expectedArrival) > new Date(b.expectedArrival) ? 1 : -1);
        var arrival = new Date(soonest[0].expectedArrival);
        var timeUntil = arrival - now;
        var minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);
        Vue.set(app.buses, id, `${minutes}m ${seconds}s`);
      }
    },
    getBusData: async function() {
      for (const [id, endpoint] of Object.entries(this.endpoints)) {
        fetch(`https://api.tfl.gov.uk/Line/${endpoint}`)
        .then(handleFetchError)
        .then(response => response.json())
        .then(data => {
          Vue.set(app.data, id, data);
        })
        .catch(console.error);
      }
    },
  },
  beforeMount() {
    this.getBusData()
    this.startTimer()
    this.refreshTimer = setInterval(() => {
      this.$forceUpdate();
    }, 60 * 60 * 1000);
  },
  beforeDestroy() {
    clearInterval(this.timer)
    clearInterval(this.refreshTimer);
  }
});
