class CcApp extends HTMLElement {
  constructor() {
    super();
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
  }

  registerState(state) {
    state.addEventListener("statechanged", (e) => {
      this.activateState (this.state, true);
/*      if (e.detail.state.parentstate == this.state) {
        var item = new CcMdcListItem("S:" + e.detail.state.title, e.detail.state.icon);
        this.drawer.addItem(item);
        item.addEventListener("click", () => {
          this.activateState (e.detail.state, state);
          this.topappbar.titleHTML = e.detail.state.title;
          e.detail.state.instantiate (this.contentdiv);
        });
        e.detail.state.addEventListener("removed", () => {
          item.parentElement.removeChild(item);
        });
      }*/
    });
  }

  activateState(state, preventInstantiate) {
    this.state = state;

    this.drawer.clear();

    if (!preventInstantiate) {
      this.topappbar.titleHTML = this.state.title;
      this.state.instantiate (this.contentdiv);
    }

    var parentstate = this.state.parentstate;
    if (parentstate) {
      var item = new CcMdcListItem(parentstate.title, parentstate.icon);
      this.drawer.addItem(item);
      item.addEventListener("click", () => {
        this.activateState (parentstate, parentstate.parentstate);
        this.topappbar.titleHTML = parentstate.title;
        parentstate.instantiate (this.contentdiv);
      });
    }

    for(let childstate of this.state.childStates) {
      var item = new CcMdcListItem("I:" + childstate.title, childstate.icon);
      this.drawer.addItem(item);
      item.addEventListener("click", () => {
        this.activateState (childstate, state);
        this.topappbar.titleHTML = childstate.title;
        childstate.instantiate (this.contentdiv);
      });
      childstate.addEventListener("removed", () => {
        item.parentElement.removeChild(item);
      });
    }
  }
}

window.customElements.define("cc-app", CcApp);

class CcPageState extends HTMLElement {
  constructor() {
    super();
    this._title = "";
    this._icon = "";

    this.childStates = [];
  }

  connectedCallback() {
    this.style.display = "none";

    var parent = this;
    while (parent = parent.parentElement) {
      if (parent instanceof CcApp) {
        parent.registerState(this);
        parent.activateState(this);
        break;
      }
      if (parent instanceof CcPageState) {
        parent.registerState (this);
        break;
      }
    }
  }

  get parentstate () {
    var parent = this;
    while (parent = parent.parentElement) {
      if (parent instanceof CcPageState) {
        return parent;
      }
    }
    return null;
  }

  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent("stateremoved", {detail: null}));
  }

  registerState(state) {
    this.childStates.push (state);
    state.addEventListener("statechanged", (e) => {
      this.dispatchEvent(new CustomEvent("statechanged", {}));
    });
    state.addEventListener("stateremoved", (e) => {
      this.childStates.splice (this.childStates.indexOf(state), 1);
      this.dispatchEvent(new CustomEvent("statechanged", {}));
      e.stopPropagation();
      e.preventDefault();
    });
    this.dispatchEvent(new CustomEvent("statechanged", {}));
  }

  get title () {
    return this._title;
  }

  get icon () {
    return this._icon;
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
  }
}

window.customElements.define("cc-page-state", CcPageState);

class CcRootPageState extends CcPageState {
  constructor () {
    super();
    this._title = "Root";
    this._icon = "book";
  }

  instantiate(element) {
    element.innerHTML = "Root";
    setTimeout(() => {
      this.innerHTML = "";
      this.appendChild(new CcUsersPageState());
      this.appendChild(new CcSimplePageState("Wecker", "alarm_on", (e) => {e.innerHTML = "Wecker";}));
      this.appendChild(new CcSimplePageState("Aufgaben", "assignment", (e) => {e.innerHTML = "Aufgaben";}));
    }, 2000);
  }
}
window.customElements.define("cc-root-page-state", CcRootPageState);

class CcSimplePageState extends CcPageState {
  constructor(title, icon, fn) {
    super();
    this._title = title;
    this._icon = icon;
    this._fn = fn;
  }

  instantiate(element) {
    this.innerHTML = "";
    return this._fn(element);
  }
}
window.customElements.define("cc-simple-page-state", CcSimplePageState);

var i = 0;

class CcUsersPageState extends CcPageState {
  constructor() {
    super();
    this._title = "Benutzer";
  }

  instantiate(element) {
    this.innerHTML = "";
    setTimeout(() => {
      debugger
      this.appendChild(new CcUserPageState("alex" + (i++)));
    }, 2000);
    element.innerHTML = "Benutzer";
  }
}
window.customElements.define("cc-users-page-state", CcUsersPageState);

class CcUserPageState extends CcPageState {
  constructor(name) {
    super();
    this._title = name;
  }

  instantiate(element) {
    this.innerHTML = "";
    element.innerHTML = "Hallo " + this._title;
  }
}
window.customElements.define("cc-user-page-state", CcUserPageState);

