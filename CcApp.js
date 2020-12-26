class CcApp extends HTMLElement {
  constructor() {
    super();

    this._drawerTitleHtml = "";
    this.stateurls = document.location.search ? document.location.search.substring(1).split("/") : [];
  }

  connectedCallback() {
    this.style.top = "0px";
    this.style.left = "0px";
    this.style.bottom = "0px";
    this.style.right = "0px";
    this.style.position = "absolute";

    this.addEventListener("dragenter", (e) => { e.stopPropagation(); e.preventDefault(); e.dataTransfer.dropEffect = "none"; }, false);
    this.addEventListener("dragover", (e) => { e.stopPropagation(); e.preventDefault(); e.dataTransfer.dropEffect = "none"; }, false);

    this.drawer = new CcMdcDrawer(this.drawerTitleHtml);
    this.appendChild (this.drawer);

    this.topappbar = new CcMdcTopAppBar(this.drawer);
    this.drawer.contentElement.appendChild (this.topappbar);
    this.drawer.drawerTitleHtml = this._drawerTitleHtml;

    this.contentdiv = document.createElement("div");
    this.topappbar.contentElement.appendChild(this.contentdiv);
  }

  set drawerTitleHtml (drawerTitleHtml) {
    this._drawerTitleHtml = drawerTitleHtml;
    if (this.drawer) {
      this.drawer.drawerTitleHtml = drawerTitleHtml;
    }
  }

  addRootState(state) {
    this.rootState = state;
    this.rootState.parentapp = this;
    this.rootState.init();
    this.activateState (this.rootState);

    this.processStateUrls();
  }

  processStateUrls() {
    var mystate = this.state || this.rootState;
    if (!mystate) {
      return;
    }
    for(var i = 0; i < this.stateurls.length; i++) {
      var stateurl = this.stateurls[i];
      if (!stateurl) {
        continue;
      }
      if (mystate._urlprefix && (mystate.urlprefix == stateurl || mystate._urlprefix.indexOf(stateurl) == 0)) {
        this.stateurls.splice (i, 1);
        i--;
        continue;
      }
      for(var state of mystate.childStates) {
        if (state._urlprefix && (state.urlprefix == stateurl || state._urlprefix.indexOf(stateurl) == 0)) {
          this.stateurls.splice (i, 1);
          i--;
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
    var promise = Promise.resolve();
    if (this.state && this.state.beforeLeave) {
      try {
        var result = this.state.beforeLeave (state);
        if (result === true) {
          promise = Promise.reject();
        } else if (result.then && result.catch) {
          promise = result;
        } else {
          promise = Promise.resolve();
        }
      } catch (e) {
      }
    }

    promise.then(() => {
      if (state.instantiate (this.contentdiv) === false) {
        return;
      }
      this.state = state;

      this.topappbar.titleHTML = this.state.title;
      this.topappbar.clearButtons();

      this.state.instantiateButtons(this.topappbar);

      var parentstate = state;
      var url = this.state.urlprefix ? "/" + this.state.urlprefix : "/";
      while(parentstate = parentstate.parentstate) {
        url = (parentstate.urlprefix ? "/" + parentstate.urlprefix : "") + url;
      }
      try {
        if (document.location.protocol == "https:" || document.location.protocol == "http:") {
          history.pushState({ }, this.state.title, "?" + url);
        }
      } catch (e) {
        //
      }

      this.refillDrawer();
    })
    .catch(() => {
      // egal
    });
  }

  stateAdded(parentstate, state) {
    if (this.state == parentstate || (parentstate == null && this.state == this.rootState)) {
      this.refillDrawer();
    }
    this.processStateUrls();
  }

  stateRemoved(parentstate, state) {
    if(this.state == state) {
      this.activateState (state.parentstate);
      this.refillDrawer();
    } else if (this.state == parentstate || (parentstate == null && this.state == this.rootState)) {
      this.refillDrawer();
    }
  }

  refillDrawer() {
    this.drawer.clear();

    var state = this.state;
    if (!state) {
      return;
    }

    while(!state.drawer) {
      if (!state.parentstate) {
        break;
      }
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
  constructor(title, icon, urlprefix, fn, fnbuttons) {
    this.title = title;
    this.icon = icon;
    this.drawer = true;
    this._fn = fn;
    this._fnbuttons = fnbuttons;
    this._urlprefix = urlprefix;
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

  addStateAfter(state, afterstate) {
    state.parentstate = this;
    state.parentapp = this.parentapp;
    state.init();

    var i = this.childStates.indexOf(afterstate);
    if (i < 0) {
      i = this.childStates.length - 1;
    }
    this.childStates.splice (i + 1, 0, state);
    this.parentapp.stateAdded(this, state);
  }

  getState(index) {
    return this.childStates[index];
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

  get urlprefix () {
    if (this._urlprefix) {
      return this._urlprefix + (this._id === null ? "" : this._id);
    }
    return null;
  }

  beforeLeave (newState) {
    return false;
  }

  instantiate(element) {
    try {
      return this._fn(element);
    } catch (e) {
      console.error(e);
    }
  }

  instantiateButtons(topappbar) {
    try {
      if (this._fnbuttons) {
        return this._fnbuttons(topappbar);
      }
    } catch (e) {}
    return false;
  }
}
