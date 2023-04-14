class CcApp extends HTMLElement {
  constructor() {
    super();

    this._drawerTitleHtml = "";
    this.stateurls = document.location.search ? document.location.search.substring(1).split("/") : [];

    this.startWithHiddenDrawer = false;
  }

  disconnectedCallback() {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
    }
  }

  connectedCallback() {
    this.drawerstyle = this.drawerstyle || this.getAttribute("drawerstyle") || "original";
    this.drawerdndarrow = null;
    if (this.getAttribute("drawerdndarrow")) {
      try {
        this.drawerdndarrow = JSON.parse(this.getAttribute("drawerdndarrow"));
      } catch (e) {
      }
    }
    this.style.top = "0px";
    this.style.left = "0px";
    this.style.bottom = "0px";
    this.style.right = "0px";
    this.style.position = "absolute";

    this.addEventListener("dragenter", (e) => { e.stopPropagation(); e.preventDefault(); e.dataTransfer.dropEffect = "none"; }, false);
    this.addEventListener("dragover", (e) => { e.stopPropagation(); e.preventDefault(); e.dataTransfer.dropEffect = "none"; }, false);

    this.drawer = new CcMdcDrawer(this.drawerTitleHtml);
    this.drawer.openDrawer = !this.startWithHiddenDrawer;
    this.drawer.dndarrowconfig = this.drawerdndarrow;
    this.appendChild (this.drawer);

    this.topappbar = new CcMdcTopAppBar(this.drawer);
    this.drawer.contentElement.appendChild (this.topappbar);
    this.drawer.drawerTitleHtml = this._drawerTitleHtml;

    this.contentdiv = document.createElement("div");
    this.topappbar.contentElement.appendChild(this.contentdiv);

    this.tooltipdiv = document.createElement("div");
    this.tooltipdiv.setAttribute("role", "tooltip");
    this.tooltipdiv.setAttribute("aria-hidden", "true");
    this.tooltipdiv.style.position = "absolute";
    this.tooltipdiv.style.display = "none";
    this.tooltipdiv.style.border = "2px solid #6D6D6D";
    this.tooltipdiv.style.backgroundColor = "#6D6D6D";
    this.tooltipdiv.style.color = "white";
    this.tooltipdiv.style.zIndex = "999999";
    this.tooltipdiv.style.borderRadius = "4px";
    this.tooltipdiv.style.padding = "10px";
    this.tooltipdiv.style.minWidth = "150px";
    this.tooltipdiv.style.maxWidth = "30vw";
    this.appendChild(this.tooltipdiv);

    this.tooltipsurface = document.createElement("div");
    this.tooltipsurface.className = "mdc-tooltip__surface";
    this.tooltipsurface.style.lineBreak = "anywhere";
    this.tooltipdiv.appendChild(this.tooltipsurface);

    this.addEventListener("mouseup", (e) => {
      if (this.tooltipTimer) {
        clearTimeout(this.tooltipTimer);
      }
    });

    this.addEventListener("mousedown", (e) => {
      if (this.tooltipTimer) {
        clearTimeout(this.tooltipTimer);
      }
    });

    this.addEventListener("mousemove", (e) => {
      if (this.tooltipTimer) {
        clearTimeout(this.tooltipTimer);
      }
      if (this.tooltiptimeout > 0) {
        this.tooltipTimer = setTimeout(() => {
          this.tooltipdiv.style.display = "block";
          this.tooltipsurface.innerText = this.tooltiptext;
          this.tooltipTimer = null;

          var top = e.clientY + 15;
          if (top > this.offsetHeight - this.tooltipdiv.offsetHeight) {
            top = this.offsetHeight - this.tooltipdiv.offsetHeight;
          }
          var left = e.clientX + 15;
          if (left > this.offsetWidth - this.tooltipdiv.offsetWidth) {
            left = this.offsetWidth - this.tooltipdiv.offsetWidth;
          }
          this.tooltipdiv.style.top = (top) + "px";
          this.tooltipdiv.style.left = (left) + "px";
        }, this.tooltiptimeout);
      }
    });

    this.addEventListener("mouseover", (e) => {
      var div = e.target;
      while (div && div.hasAttribute) {
        var tooltipid = "";
        if (div.hasAttribute("tooltipid")) {
          tooltipid = div.getAttribute("tooltipid");
        } else if (div.tooltipid) {
          tooltipid = div.tooltipid;
        }
        if (tooltipid) {
          if (tooltipid != this.lasttooltipid) {
            this.lasttooltipid = tooltipid;
            this.dispatchEvent(new CustomEvent("tooltipid_changed", {detail : this.lasttooltipid}));
            this.dispatchEvent(new CustomEvent("tooltipid_changed2", {detail : { tooltipid: this.lasttooltipid, div} }));
          }
          return;
        }
        div = div.parentNode;
      }

      this.lasttooltipid = "";
      this.dispatchEvent(new CustomEvent("tooltipid_changed", {detail : this.lasttooltipid}));
      this.dispatchEvent(new CustomEvent("tooltipid_changed2", {detail : { tooltipid: this.lasttooltipid, div: null} }));
    });
  }

  set drawerTitleHtml (drawerTitleHtml) {
    this._drawerTitleHtml = drawerTitleHtml;
    if (this.drawer) {
      this.drawer.drawerTitleHtml = drawerTitleHtml;
    }
  }

  hideTooltip() {
    if (this.tooltipTimer) {
      clearTimeout(this.tooltipTimer);
    }
    this.tooltiptimeout = 0;
    this.tooltipdiv.style.display = "none";
  }

  setTooltipText(tooltiptext) {
    this.hideTooltip();
    this.tooltiptext = tooltiptext;
  }

  showTooltip(timeout) {
    this.hideTooltip();
    this.tooltiptimeout = timeout;
  }

  addRootState(state) {
    this.state = null;
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

  redrawDrawerAndTitle() {
    this.topappbar.titleHTML = this.state.title;
    this.refillDrawer();
  }

  reactivateState() {
    var promise = Promise.resolve();
    if (this.state && this.state.beforeLeave) {
      try {
        var result = this.state.beforeLeave (this.state);
        if (result === true) {
          promise = Promise.reject();
        } else if (result && result.then && result.catch) {
          promise = result;
        } else {
          promise = Promise.resolve();
        }
      } catch (e) {
      }
    }
    promise.then(() => {
      var state = this.state;
      this.state = null;
      this.activateState(state);
    });

  }

  activateState(state) {
    var promise = Promise.resolve();
    if (this.state && this.state.beforeLeave) {
      try {
        var result = this.state.beforeLeave (state);
        if (result === true) {
          promise = Promise.reject();
        } else if (result && result.then && result.catch) {
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

      this.topappbar.clearButtons();
      
      this.state.instantiateButtons(this.topappbar);

      this.dispatchEvent(new CustomEvent("topappbuttons", {}));

      var titlediv = document.createElement("span");
      titlediv.style.cursor = "default";

      if (state.documenttitle) {
        document.title = state.documenttitle;
      } else if (this.documenttitle) {
        document.title = this.documenttitle;
      }

      var parentstate = state;
      var url = this.state.urlprefix ? "/" + this.state.urlprefix : "/";
      
      var singlediv = document.createElement("span");
      singlediv.innerHTML = this.state.title;
      singlediv.style.color = "#909CCC";
      titlediv.appendChild(singlediv);

      while(parentstate = parentstate.parentstate) {
        let tempparent = parentstate;
        url = (parentstate.urlprefix ? "/" + parentstate.urlprefix : "") + url;

        var singlediv = document.createElement("span");
        singlediv.style.color = "#888";
        singlediv.innerHTML = "&nbsp;&#11162;&nbsp;";
        titlediv.insertBefore(singlediv, titlediv.childNodes[0]);

        var singlediv = document.createElement("span");
        singlediv.innerHTML = parentstate.title;
        singlediv.style.cursor = "pointer";
        singlediv.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.activateState(tempparent);
        });
        titlediv.insertBefore(singlediv, titlediv.childNodes[0]);
      }
      try {
        if (document.location.protocol == "https:" || document.location.protocol == "http:") {
          history.pushState({ }, this.state.title, "?" + url);
        }
      } catch (e) {
        //
      }

      this.topappbar.titleHTML = titlediv;

      this.refillDrawer();
    })
    .catch(() => {
      // egal
    });
  }

  updateUrlprefix(urlprefix) {
    this.state._urlprefix = urlprefix;
    var parentstate = this.state;
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
  }

  getAppPath() {
    var parentstate = this.state;
    var url = this.state.urlprefix ? "/" + this.state.urlprefix : "/";
    
    while(parentstate = parentstate.parentstate) {
      url = (parentstate.urlprefix ? "/" + parentstate.urlprefix : "") + url;
    }
    return url;
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

    switch (this.drawerstyle) {
      case "tree":
        var addState = (parent, localstate, level) => {
          var item = createCcMdcListItem(localstate.title, localstate.icon);
          item.style.marginLeft = (level * 10) + "px";
          item.inactive = (localstate == this.state);
          item.activated = (localstate == this.state);
          item.addEventListener("click", (e) => {
            this.activateState (localstate);
            e.preventDefault();
            e.stopPropagation();
          });
          this.drawer.addItem(item);

          for(let childstate of localstate.childStates) {
            addState(state, childstate, level + 1);
          }
        };
        addState(null, this.rootState, 0);
        break;

      default:
        var parentstate = state.parentstate;
        if (parentstate) {
          var item = createCcMdcListItem(`Zurück` , "arrow_back"); // &nbsp;<span style="font-size:8px;">${parentstate.title}</span>
          this.drawer.addItem(item);
          item.addEventListener("click", (e) => {
            this.activateState (parentstate);
            e.preventDefault();
            e.stopPropagation();
          });
        } else {
          var item = createCcMdcListItem("", "");
          item.inactive = true;
          this.drawer.addItem(item);
        }
    
        var item = createCcMdcListItem(state.title, state.icon);
        item.activated = true;
        item.inactive = true;
        this.drawer.addItem(item);
    
        for(let childstate of state.childStates) {
          var item = createCcMdcListItem(childstate.title, childstate.icon);
          item.selected = (childstate == this.state);

          if (childstate.dnd) {
            removeChildNodes(childstate.dnd);
            childstate.dnd.appendChild (item);
            this.drawer.addItem(childstate.dnd);
          } else {
            this.drawer.addItem(item);
          }

          item.addEventListener("click", (e) => {
            this.activateState (childstate);
            e.preventDefault();
            e.stopPropagation();
          });
        }
        break;
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
