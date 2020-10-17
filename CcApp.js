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

    this.titlediv = document.createElement("div");
    this.appendChild(this.titlediv);

    this.contentdiv = document.createElement("div");
    this.appendChild(this.contentdiv);

    this.titlediv.innerHTML = "Uninitialized title";
    this.contentdiv.innerHTML = "Uninitialized title";
  }

  registerState(state) {
    this.state = state;
    this.titlediv.innerHTML = this.state.title;
    this.state.instantiate (this.contentdiv);

    this.state.addEventListener("stateadded", (e) => {
      console.log(e.detail);
    });
  }
}

window.customElements.define("cc-app", CcApp);

class CcPageState extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.style.display = "none";

    var parent = this;
    while (parent = parent.parentElement) {
      if (parent instanceof CcApp) {
        parent.registerState(this);
        this.rootstate = true;
        break;
      }
      if (parent instanceof CcPageState) {
        parent.registerState (this);
        break;
      }
    }
  }

  registerState(state) {
    state.addEventListener("stateadded", (e) => {
      e.detail.parents.push (this);
      this.dispatchEvent(new CustomEvent("stateadded", {detail: e.detail}))
    });
    this.dispatchEvent(new CustomEvent("stateadded", {detail: {parents: [this]}}))
  }

  get title () {
    return "Hallo Titel!";
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
  }
}

window.customElements.define("cc-page-state", CcPageState);

class CcRootPageState extends CcPageState {
  get title () {
    return "Hallo Titel!";
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
    setTimeout(() => {
      debugger;
      var t = new CcUsersPageState();
      this.appendChild(t);
    }, 2000);
  }
}
window.customElements.define("cc-root-page-state", CcRootPageState);

class CcUsersPageState extends CcPageState {
  constructor() {
    super();
    setTimeout(() => {
      debugger;
      var t = new CcUserPageState();
      this.appendChild(t);
    }, 2000);
  }
  get title () {
    return "Hallo Titel!";
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
  }
}
window.customElements.define("cc-users-page-state", CcUsersPageState);

class CcUserPageState extends CcPageState {
  get title () {
    return "Hallo Titel!";
  }

  instantiate(element) {
    element.innerHTML = "Hallo";
  }
}
window.customElements.define("cc-user-page-state", CcUserPageState);

