'use strict';

// LEC 238. Managing Workout Data: Creating Classes
// Main Class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // id = últimas 10 cifras de Date
  // 241. Move to Marker On Click
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...;
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  // 240. Rendering Workouts
  _setDescription() {
    // Dizer-lhe a preetir que ignore a seguinte linha
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // prettier-ignore
    this.descritption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  // 241. Move to Marker On Click
  click() {
    //
    this.clicks++;
  }
}
// Child classes
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running';
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // Pace = min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // Speed = km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// TESTING
const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 92, 523);

// LEC 237. Refactoring for Project Architecture
// Definiçom da CLASS App

//////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();
    // Get data from local Storage
    this._getLocalStorage();
    // ATTACH EVENT HANDLERS
    // LEC 235. Rendering Workout Input Form
    form.addEventListener('submit', this._newWorkout.bind(this)); // Passamos o método como argumento, mais nom o chamamos aqui. NOTE: o this de um método passado por um EventListener será sempre o do elemento que tem o listener (form). Mais o método deve apontar ao this de App. Usamos bind()
    inputType.addEventListener('change', this._toggleElevationField); // NOTE: só é necessário usar BIND quando o método chamado trabalha com THIS !!!!
    // LEC 241. Move to Marker On Click
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    // LEC 232. Using the Geolocation API
    if (navigator.geolocation) {
      // Método de geolocation.getCurrentPosition(f1, f2)
      navigator.geolocation.getCurrentPosition(
        // 1ª funçom em caso de éxito
        this._loadMap.bind(this),
        // 2ª funçom em caso de fracaso
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    // As coordesnadas que recolho de geolocation.getCurrentPosition()
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    //EM Google Maps
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    // LEC 233. Displaying a Map Using Leaflet Library
    // L é o OBJ principal de Leaflet (namespace???)
    // Os métodos que temos som: L.map(), L.tileLayer(), L.marker(), L.addTo(), L.bindPopUp(), L.openPopup
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    // Handling clicks on this.#map
    this.#map.on('click', this._showForm.bind(this));

    // 242. Working with localStorage.
    // Render de MARKUPS on the map, quando por fim todo o mapa esteja descarregado
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  // 240. Rendering Workouts
  _hideForm() {
    // Clear Input fields
    inputCadence.value =
      inputElevation.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Ocultamos o <form> e desactivamos com truco a animaçom que tem em CSS, ocultando primeiro passando o seu display a "none" e logo regressando ao estado normal "grid"
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Comprova que todos os items do ARR som NUM
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // true||false
    // Comprova que todos os items do ARR som NUM > 0
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); // true||false

    e.preventDefault();
    // Get data from form
    const type = inputType.value; // Str = "running"||"cycling"
    const distance = +inputDistance.value; // Number
    const duration = +inputDuration.value; // Number
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If  actitity = running, create Running OBJ
    if (type === 'running') {
      const cadence = +inputCadence.value; // Number
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If  actitity = cycling, create Cycling OBJ
    if (type === 'cycling') {
      const elevation = +inputElevation.value; // Number
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // Add new OBJ to workout ARR
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);
    // Hide form + clear input fields
    this._hideForm();

    // 242. Working with localStorage
    // Set local Storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // LEC 234. Displaying a Map Marker
    // Usamos o método L.map.on()
    // desestruturaçom de OBJ
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.descritption}`
      )
      .openPopup();
  }

  // LEC 240. Rendering Workouts

  _renderWorkout(workout) {
    // Criamos umha etiqueta HTML
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.descritption}</h2>
      <div class="workout__details">
       <span class="workout__icon">${
         workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
       }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
      </div>
       <div class="workout__details">
       <span class="workout__icon">⏱</span>
       <span class="workout__value">${workout.distance}</span>
       <span class="workout__unit">min</span>
       </div>
      `;

    if (workout.type === 'running') {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>
        `;
    }
    if (workout.type === 'cycling') {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
        `;
    }
    //   insire como Sibling de <form> JUSTO DESPOIS deste. Portanto tamém aparecerá antes do último Workout inserido
    form.insertAdjacentHTML('afterend', html);
  }

  // LEC 241. Move to Marker On Click
  _moveToPopup(e) {
    // Técnica de Delegation
    // 1. Buscamos o "parent" que gestionará o evento
    // No parent temos o atributo data-id que coincide co "id" do nosso workout no ARR workouts
    const workoutEl = e.target.closest('.workout');
    // 2. Guard Clause
    if (!workoutEl) return;
    // 3. Identificamos no array o elemento premido na lista do UI
    // Busac um elemento cujo "elemento.id" seja igual ao id (dataset.id) do eleemnto clicado
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // 4. Centramos o elemento no mapa
    // setView ([coordenadas], zoom=13, options(um OBJ))
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1, // transiçom 1 segundo // "pan = to move gradually in one direction"
      },
    });

    // 241. Move to Marker On Click
    // Using the public interface
    // Eliminamos a funcionalidade, que em todo caso só tinha valor educacional
    // workout.click();
  }
  // LEC 242. Working with localStorage (API LocalStorage)

  _setLocalStorage() {
    // Ao método localStorage.setItem() proporcionamos um KEY e um VALUE que será todo o noss ARR workouts convertido em STR. Se comprovamos na Inspeccionar>Application>Storage>LocalStorage, veremos um PAR K-V. O value é apresentado como um OBJ, mais em realidade foi guardado em LocalStorage como um STR, tal como ordenamos com JSON.stringify()
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // NOTE: Quando convertemos de OBJ a STR e logo de volta a OBJ, perdemos a CADEA de PROTOYPE. Os OBJ que recuperamos de LocalStorage som OBJ normais, nom som objectos construidos coa classe Running ou Cycling. Portanto nom poderám herdar os métodos e propriedades de Running e Class.
    // ...... Umha SOLUÇOM é construir novos objectos quando fazemos parseamos a STR de localStorage. Mais nom o imos fazer aqui.
    // O contrario de setLocalStorage. Converetemos o STR em JSON
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // Método Público
  // Remove os nosso dados guardados em localStorage e recarrega a página.
  // Como nom temos accesso ao método desde a UI, executamos desde CLI
  reset() {
    localStorage.removeItem('workouts');
    // location é um OBJ do browser com um monte de métodos, entre eles reload()
    location.reload();
  }
}
// OBJ app class App
const app = new App();
