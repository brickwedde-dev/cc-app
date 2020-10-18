class CcApp extends HTMLElement {
  constructor() {
    super();

    this.stateurls = document.location.pathname.split("/");
    this.stateurls = "/users/user1".split("/");
  }

  connectedCallback() {
    this.style.top = "0px";
    this.style.left = "0px";
    this.style.bottom = "0px";
    this.style.right = "0px";
    this.style.position = "absolute";

    this.drawer = new CcMdcDrawer();
    this.appendChild (this.drawer);

    this.topappbar = new CcMdcTopAppBar(this.drawer);
    this.drawer.contentElement.appendChild (this.topappbar);

    this.contentdiv = document.createElement("div");
    this.topappbar.contentElement.appendChild(this.contentdiv);

    this.rootState = new CcRootPageState();
    this.rootState.parentapp = this;
    this.rootState.init();
    this.activateState (this.rootState);

    this.processStateUrls();
  }

  processStateUrls() {
    if (!this.state) {
      return;
    }
    for(var i = 0; i < this.stateurls.length; i++) {
      var stateurl = this.stateurls[i];
      if (!stateurl) {
        continue;
      }
      for(var state of this.state.childStates) {
        if (state._urlprefix && (state.urlprefix == stateurl || state._urlprefix.indexOf(stateurl) == 0)) {
          this.stateurls.splice (i, 1);
          this.activateState (state);
          break;
        }
      }
      break;
    }
  }

  addState(state) {
    this.rootState.addState(state);
  }

  activateState(state) {
    this.state = state;

    this.topappbar.titleHTML = this.state.title;
    this.state.instantiate (this.contentdiv);

    var parentstate = state;
    var url = this.state.urlprefix ? "/" + this.state.urlprefix : "/";
    while(parentstate = parentstate.parentstate) {
      url = (parentstate.urlprefix ? "/" + parentstate.urlprefix : "") + url;
    }
    history.pushState({ }, this.state.title, url);

    this.refillDrawer();
  }

  stateAdded(parentstate, state) {
    if (this.state == parentstate || (parentstate == null && this.state == this.rootState)) {
      this.refillDrawer();
    }
    this.processStateUrls();
  }

  stateRemoved(parentstate, state) {
    if (this.state == parentstate || (parentstate == null && this.state == this.rootState)) {
      this.refillDrawer();
    }
  }

  refillDrawer() {
    this.drawer.clear();

    var state = this.state;
    while(!state.drawer) {
      state = state.parentstate;
    }
    var parentstate = state.parentstate;
    if (parentstate) {
      var item = new CcMdcListItem(parentstate.title, parentstate.icon);
      this.drawer.addItem(item);
      item.addEventListener("click", (e) => {
        this.activateState (parentstate);
        e.preventDefault();
        e.stopPropagation();
      });
    } else {
      var item = new CcMdcListItem("", "");
      item.inactive = true;
      this.drawer.addItem(item);
    }

    var item = new CcMdcListItem(state.title, state.icon);
    item.activated = true;
    item.inactive = true;
    this.drawer.addItem(item);

    for(let childstate of state.childStates) {
      var item = new CcMdcListItem(childstate.title, childstate.icon);
      this.drawer.addItem(item);
      item.addEventListener("click", (e) => {
        this.activateState (childstate);
        e.preventDefault();
        e.stopPropagation();
      });
    }
  }
}

window.customElements.define("cc-app", CcApp);

class CcPageState {
  constructor() {
    this._title = "";
    this._icon = "";
    this._drawer = false;
    this._urlprefix = null;
    this._id = null;

    this.childStates = [];
  }

  init() {
  }

  addState(state) {
    state.parentstate = this;
    state.parentapp = this.parentapp;
    state.init();
    this.childStates.push (state);
    this.parentapp.stateAdded(this, state);
  }

  removeState(state) {
    var index = this.childStates.indexOf(state);
    if (index >= 0) {
      this.childStates.splice (index, 1);
      this.parentapp.stateRemoved(this, state);
    }
  }

  removeStates() {
    this.childStates.splice (0, this.childStates.length);
    this.parentapp.stateRemoved(this, null);
  }

  get title () {
    return this._title;
  }

  get icon () {
    return this._icon;
  }

  get drawer () {
    return this._drawer;
  }

  get urlprefix () {
    if (this._urlprefix) {
      return this._urlprefix + (this._id === null ? "" : this._id);
    }
    return null;
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
  }
}

class CcRootPageState extends CcPageState {
  constructor () {
    super();
    this._title = "Übersicht";
    this._icon = "dashboard";
    this._drawer = true;
  }

  init() {
    this.aufgaben = new CcSimplePageState("Aufgaben", "assignment", "jobs", (e) => {e.innerHTML = "Aufgaben";});
    this.addState(new CcUsersPageState());
    this.addState(new CcSimplePageState("Wecker", "alarm_on", "alarm", (e) => {e.innerHTML = "Wecker";}));
  }

  instantiate(element) {
    element.innerHTML = `Root`;
    setTimeout(() => {
      this.removeState(this.aufgaben);
    }, 1000);
    setTimeout(() => {
      this.addState(this.aufgaben);
    }, 2000);
  }
}

class CcSimplePageState extends CcPageState {
  constructor(title, icon, urlprefix, fn) {
    super();
    this._title = title;
    this._icon = icon;
    this._fn = fn;
    this._urlprefix = urlprefix;
  }

  instantiate(element) {
    return this._fn(element);
  }
}

var i = 0;

class CcUsersPageState extends CcPageState {
  constructor() {
    super();
    this._title = "Benutzer";
    this._icon = "group";
    this._drawer = true;
    this._urlprefix = "users";
  }

  instantiate(element) {
    setTimeout(() => {
      var st = new CcUserPageState("alex" + (i++));
      st._id = i;
      this.addState(st);
    }, 2000);
    element.innerHTML = "Benutzer";
  }
}

class CcUserPageState extends CcPageState {
  constructor(name) {
    super();
    this._title = name;
    this._icon = "face";
    this._drawer = false;
    this._urlprefix = "user";
  }

  instantiate(element) {
    element.innerHTML = "Hallo " + this._title;
  }
}

