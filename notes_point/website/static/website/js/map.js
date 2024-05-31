
let mapInstance = null;

function initMap() {
  let alertModalDOMElement = $("#alert-modal").get(0);
  let alertModal = new AlertModal(alertModalDOMElement);
  let newNoteModalDOMElement = $("#new-note-modal").get(0);
  let newNoteModal = new NewNoteModal(newNoteModalDOMElement, 
    alertModal);
  let viewNoteModalDOMElement = $("#view-note-modal").get(0);
  let viewNoteModal = new ViewNoteModal(viewNoteModalDOMElement, 
    alertModal);
  let noteCreationControlsHolderDOMElement = $(
    "#note-creation-controls").get(0);
  let noteCreationControls = new NoteCreationControls(
    noteCreationControlsHolderDOMElement);
  let mapDOMElement = $("#map").get(0);
  mapInstance = new MapGoogle(mapDOMElement, 
    noteCreationControls, newNoteModal, alertModal, viewNoteModal);
};


class MapGoogle {

  constructor(mapDOMElement, 
    noteCreationControls, newNoteModal, alertModal, viewNoteModal) {
    // Using map DOM element to hold google map.
    this._$map = $(mapDOMElement);
    this._map = new google.maps.Map(mapDOMElement, {
      center: { lat: 0, lng: 0 },
      zoom: 3,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControlOptions: {
        // Collapsing the map's default control buttons to a dropdown menu.
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }
    });
    this._markerClusterer =  new markerClusterer.MarkerClusterer(
      {map: this._map, renderer: new CustomClusterRenderer()});
    this._viewNoteModal = viewNoteModal;
    this._newNoteModal = newNoteModal;
    this._alertModal = alertModal;
    this._noteCreationControls = noteCreationControls;
    this._newNoteModal.setMap(this);
    this.addNoteCreationControls();
    this.getActivesNotesMarkers();
    this.setupMyLocationButton();
  };

  setupMyLocationButton() {
    let myLocationButton = $("<button class='btn main-button " + 
      "fw-medium shadow-sm m-3'>My Location</button>");
      
    myLocationButton.on("click", () => {
      this.focusOnMyLocation();
    });
    this._map.controls[google.maps.ControlPosition.RIGHT_TOP].push(
      myLocationButton.get(0));
  };
  

  focusOnMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this._map.setCenter(pos);
          this._map.setZoom(14);
        },
        () => {
          this._alertModal.show("Error", 
          "Sorry, an error ocurred while getting location.");
        }
      );
    }
    else {
      console.log("No support for geolocation.");
    };
  };

  addNoteCreationControls() {
    this._map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(
      this._noteCreationControls.getDOMElement());
    this._noteCreationControls.setPointSelectionModeActivatedListener(
      () => this.onPointSelectionActivated());
    this._noteCreationControls.setPointSelectionModeDeactivatedListener(
      () => this.onPointSelectionDeactivated());
  };

  updateControlsPosition() {
    this._map.controls[google.maps.ControlPosition.BOTTOM_CENTER].pop(
      this._noteCreationControls.getDOMElement());
    this._map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(
      this._noteCreationControls.getDOMElement());
  };

  shouldMarkerBeHighlighted(id) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("highlight_note") == id;
  };

  cleanHightlightParam() {
    let urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("highlight_note");
    // Push new url to the history to prevent highlighting again on note creation.
    window.history.pushState(null, '',
     window.location.origin + 
     window.location.pathname + 
     `?${urlParams.toString()}`);

  };

  highlightMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this._map.panTo(marker.position);
    marker.addListener("click", () => {
      // Remove animation on click in highlighted note.
      marker.setAnimation(null);
    })
    this._map.setZoom(17);
  };

  onNoteCreated(latLng) {
    this._map.panTo(latLng);
    this.getActivesNotesMarkers();
  };

  getActivesNotesMarkers() {
    $.get({url: "/api/note/actives/location/", timeout: 15000})
      .done(response => this.onGetActiveMarkersNotesSuccess(
        response.content))
      .fail(() => this.onGetActiveNotesMarkersFail());
  };

  onGetActiveMarkersNotesSuccess(notes) {
    this.cleanNotesMarkers();
    this.setNotesMarkers(notes);
  };

  onGetActiveNotesMarkersFail() {
    this._alertModal.show("Error","Sorry, an error ocurred " + 
    "while updating the notes in map.");
  };

  cleanNotesMarkers() {
    this._markerClusterer.clearMarkers();
  };

  setNotesMarkers(notes) {
    for(let note of notes) {

      let marker = new google.maps.Marker({
        position: {lat: note.latitude, lng: note.longitude},
        map: this._map,
        icon: {
          url: "/static/website/images/single_note_marker.png",
          scaledSize: new google.maps.Size(50, 50),
        }
      });

      if (this.shouldMarkerBeHighlighted(note.id)) {
        this.highlightMarker(marker)
        this.cleanHightlightParam();
      }
      
      marker.addListener("click", () => {
        this._viewNoteModal.show(note.id)
      });
      this._markerClusterer.addMarker(marker);
    };
  };

  setPointerCursorToggled(state) {
    this._map.setOptions({
      draggableCursor: 'pointer' ? state : "drag",
      draggingCursor: 'pointer' ? state : "drag"
    });

  };

  onPointSelectionActivated() {
    
    this.updateControlsPosition();
    this.setPointerCursorToggled(true);

    this.pointSelectionClickListener = google.maps.event.addListenerOnce(
      this._map, "click", (e) => {
        this._newNoteModal.show(e.latLng);
        this._noteCreationControls.onPointSelected();
        this.updateControlsPosition();
        this.setPointerCursorToggled(false);
      });
  };

  onPointSelectionDeactivated() {
    this.updateControlsPosition();
    this.setPointerCursorToggled(false);
    google.maps.event.removeListener(this.pointSelectionClickListener);
  };


};

class CustomClusterRenderer {

  render({ count, position }) {

    return new google.maps.Marker({
      position,
      icon: {
        url: `/static/website/images/multiple_note_marker.png`,
        scaledSize: new google.maps.Size(50, 50),
      },
      label: {
        text: String(count),
        color: "goldenrod",
        fontSize: "10px",
        fontWeight: "bold"
      },
      // adjust zIndex to be above other markers
      zIndex: 1000 + count,
    });

  };

};


class NoteCreationControls {

  constructor(controlsHolderDOMElement) {
    this._$controlsHolder = $(controlsHolderDOMElement);
    this._$newNoteButton = this._$controlsHolder.children(
      "#new-note-button");
    this._$cancelNoteButton = this._$controlsHolder.children(
      "#cancel-note-button");
    this._$cancelNoteButton.hide();
  };

  onPointSelected() {
    this._$cancelNoteButton.hide();
    this._$newNoteButton.show();
  };

  setPointSelectionModeActivatedListener(callback) {
    this._$newNoteButton.on("click", () => {
      callback();
      this._$cancelNoteButton.show();
      this._$newNoteButton.hide();
    });

  };

  setPointSelectionModeDeactivatedListener(callback) {
    this._$cancelNoteButton.on("click", () => {
      callback();
      this._$cancelNoteButton.hide();
      this._$newNoteButton.show();
    });
  };

  getDOMElement() {
    return this._$controlsHolder.get(0);
  };

};


class NewNoteModal {

  constructor(newNoteModalDOMElement, alertModal) {
    this._alertModal = alertModal;
    this._bootstrapWrapper = new bootstrap.Modal(newNoteModalDOMElement);
    this._$newNoteModal = $(newNoteModalDOMElement);
    this._$newNoteForm = this._$newNoteModal.find("#new-note-form");
    this._$newNoteLoadingSpinner = this._$newNoteForm.find(
      "#new-note-loading-spinner");
    this._$newNotePostButton = this._$newNoteForm.find(
      "#new-note-post-button");
    this.setLoadingModeToggled(false);
    this._$newNoteForm.on("submit", event => this.submit(event));
  };

  setMap(map) {
    this._googleMap = map;
  };

  setLoadingModeToggled(state) {
    if (state) {
      this._$newNoteLoadingSpinner.show();
      this._$newNotePostButton.val("Creating");
      this._$newNotePostButton.attr("disabled","");
    }
    else {
      this._$newNoteLoadingSpinner.hide();
      this._$newNotePostButton.val(this._$newNotePostButton.data(
        "default-text"));
      this._$newNotePostButton.removeAttr("disabled");
    };
  };
  
  setLatLng(latLng) {
    let latitudeField = this._$newNoteForm.find("#new-note-latitude");
    let longitudeField = this._$newNoteForm.find("#new-note-longitude");

    latitudeField.val(latLng.lat());
    longitudeField.val(latLng.lng());
  };

  show(latLng) {
    this.setLatLng(latLng);
    this._bootstrapWrapper.show();
  };

  submit(e) {
    e.preventDefault();
    let url = this._$newNoteForm.attr("action");
    this.setLoadingModeToggled(true);
    let data = this._$newNoteForm.serialize();
    let data_array = this._$newNoteForm.serializeArray();
    let latLng = {
      lat: Number.parseFloat(data_array[2].value),
      lng: Number.parseFloat(data_array[3].value)
    };
    $.post(
      {
        url: url, 
        data: data,
        timeout: 15000
      })
      .done(() => this.onNewNoteCreationSuccess(latLng))
      .fail(() => this.onNewNoteCreationFail());
  };


  onNewNoteCreationSuccess(latLng) {
    this._bootstrapWrapper.hide();
    this._$newNoteForm.trigger('reset');
    this._googleMap.onNoteCreated(latLng);
    this.setLoadingModeToggled(false);
  };

  onNewNoteCreationFail() {
    this._bootstrapWrapper.hide();
    this._$newNoteForm.trigger('reset'); 
    this.setLoadingModeToggled(false);
    this._alertModal.show("Error","Sorry, an error " + 
    "ocurred while creating the note.");
  };

};

class ViewNoteModal {

    constructor(viewNoteModalDOMElement, alertModal) {
      this._bootstrapWrapper = new bootstrap.Modal(viewNoteModalDOMElement);
      this._$viewNoteModal = $(viewNoteModalDOMElement);
      this._viewNoteModal = viewNoteModalDOMElement;
      this._alertModal = alertModal;
    };

    show(id) {
      this.getNoteData(id);
    };

    getNoteData(id) {
      $.get({url: `/api/note/actives/data/${id}/`, timeout: 15000})
        .done(response => this.onGetNoteDataSuccess(response.content))
        .fail(() => this.onGetNoteDataFail());
    };

    onGetNoteDataSuccess(data) {
      this._$viewNoteModal.find("#view-note-message").val(data.message);
      this._$viewNoteModal.find("#view-note-duration").val(data.duration);
      this.setupNewChatLink(data);
      this._bootstrapWrapper.show();
    };

    onGetNoteDataFail() {
      this._alertModal.show("Error","Sorry, an error " + 
      "ocurred while opening the note.");
    };

    setupNewChatLink(data) {
      let archor = this._$viewNoteModal.find("#view-note-new-chat-link");
      if (data.from_self) {
        archor.hide();
      }
      else {
        let url = data.chat_id ? archor.data("open-chat-url") + 
        data.chat_id : archor.data("new-chat-url") + data.note_id;
        archor.attr("href", url);
        archor.show();
      };
    };


};

class AlertModal {

  constructor(alertModalDOMElement) {
    this._bootstrapWrapper = new bootstrap.Modal(alertModalDOMElement);
    this._$alertModal = $(alertModalDOMElement);
  };

  show(title, text) {
    this._$alertModal.find("#alert-modal-title").html(title);
    this._$alertModal.find("#alert-modal-text").html(text);
    this._bootstrapWrapper.show();
  };

};




