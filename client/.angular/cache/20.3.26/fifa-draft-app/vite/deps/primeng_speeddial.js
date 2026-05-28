import {
  Tooltip,
  TooltipModule
} from "./chunk-76JD2U77.js";
import "./chunk-TAOMMH2Y.js";
import {
  ButtonDirective,
  ButtonIcon,
  ButtonModule
} from "./chunk-2C56UAPD.js";
import "./chunk-VFALNAVV.js";
import {
  PlusIcon
} from "./chunk-ZHIMYK5A.js";
import "./chunk-ZSQAUM2R.js";
import {
  Ripple
} from "./chunk-4TIGDJCS.js";
import "./chunk-7CG63DZB.js";
import "./chunk-3S2DWQCR.js";
import {
  BaseComponent,
  PARENT_INSTANCE
} from "./chunk-EGGI5434.js";
import {
  BaseStyle
} from "./chunk-3FXDJXW6.js";
import {
  RouterModule
} from "./chunk-Y5ZHINHL.js";
import "./chunk-3CPBSV42.js";
import "./chunk-AEVAQUIM.js";
import "./chunk-D2GVIOVM.js";
import {
  Bind
} from "./chunk-PXQTWIM2.js";
import {
  PrimeTemplate,
  SharedModule
} from "./chunk-YA6A3ZWO.js";
import {
  CommonModule,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
  isPlatformBrowser
} from "./chunk-FTUO75RU.js";
import "./chunk-IJIJT3WP.js";
import {
  R,
  Y,
  bt,
  s3 as s,
  z
} from "./chunk-RUVQ62FY.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  Output,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  numberAttribute,
  setClassMetadata,
  signal,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵviewQuery
} from "./chunk-2PCOFCQ6.js";
import {
  asapScheduler
} from "./chunk-KYJO63D3.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-WDMUDEB6.js";

// ../node_modules/@primeuix/styles/dist/speeddial/index.mjs
var style = "\n    .p-speeddial {\n        position: static;\n        display: flex;\n        gap: dt('speeddial.gap');\n    }\n\n    .p-speeddial-button {\n        z-index: 1;\n    }\n\n    .p-speeddial-button.p-speeddial-rotate {\n        transition:\n            transform 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,\n            background dt('speeddial.transition.duration'),\n            color dt('speeddial.transition.duration'),\n            border-color dt('speeddial.transition.duration'),\n            box-shadow dt('speeddial.transition.duration'),\n            outline-color dt('speeddial.transition.duration');\n        will-change: transform;\n    }\n\n    .p-speeddial-list {\n        margin: 0;\n        padding: 0;\n        list-style: none;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        transition: inset-block-start 0s linear dt('speeddial.transition.duration');\n        pointer-events: none;\n        outline: 0 none;\n        z-index: 2;\n        gap: dt('speeddial.gap');\n    }\n\n    .p-speeddial-item {\n        transform: scale(0);\n        opacity: 0;\n        transition:\n            transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,\n            opacity 0.8s;\n        will-change: transform;\n    }\n\n    .p-speeddial-circle .p-speeddial-item,\n    .p-speeddial-semi-circle .p-speeddial-item,\n    .p-speeddial-quarter-circle .p-speeddial-item {\n        position: absolute;\n    }\n\n    .p-speeddial-mask {\n        position: absolute;\n        inset-inline-start: 0;\n        inset-block-start: 0;\n        width: 100%;\n        height: 100%;\n        opacity: 0;\n        background: dt('mask.background');\n        border-radius: 6px;\n        transition: opacity 150ms;\n    }\n\n    .p-speeddial-mask-visible {\n        pointer-events: none;\n        opacity: 1;\n        transition: opacity 150ms;\n    }\n\n    .p-speeddial-open .p-speeddial-list {\n        pointer-events: auto;\n    }\n\n    .p-speeddial-open .p-speeddial-item {\n        transform: scale(1);\n        opacity: 1;\n    }\n\n    .p-speeddial-open .p-speeddial-rotate {\n        transform: rotate(45deg);\n    }\n";

// ../node_modules/primeng/fesm2022/primeng-speeddial.mjs
var _c0 = ["button"];
var _c1 = ["item"];
var _c2 = ["icon"];
var _c3 = ["container"];
var _c4 = ["list"];
var _c5 = (a0) => ({
  toggleCallback: a0
});
var _c6 = (a0, a1) => ({
  item: a0,
  i: a1
});
var _c7 = (a0, a1, a2) => ({
  $implicit: a0,
  index: a1,
  toggleCallback: a2
});
function SpeedDial_ng_container_2__svg_svg_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵelement(0, "svg", 10);
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵproperty("pt", ctx_r2.ptm("pcButton")["icon"]);
  }
}
function SpeedDial_ng_container_2_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function SpeedDial_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementContainerStart(0);
    ɵɵelementStart(1, "button", 7);
    ɵɵlistener("click", function SpeedDial_ng_container_2_Template_button_click_1_listener($event) {
      ɵɵrestoreView(_r2);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onButtonClick($event));
    })("keydown", function SpeedDial_ng_container_2_Template_button_keydown_1_listener($event) {
      ɵɵrestoreView(_r2);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onTogglerKeydown($event));
    });
    ɵɵtemplate(2, SpeedDial_ng_container_2__svg_svg_2_Template, 1, 1, "svg", 8)(3, SpeedDial_ng_container_2_ng_container_3_Template, 1, 0, "ng-container", 9);
    ɵɵelementEnd();
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵstyleMap(ctx_r2.buttonStyle);
    ɵɵclassMap(ctx_r2.cn(ctx_r2.cx("pcButton"), ctx_r2.buttonClassName));
    ɵɵproperty("icon", ctx_r2.buttonIconClass)("disabled", ctx_r2.disabled)("buttonProps", ctx_r2.buttonProps)("pt", ctx_r2.ptm("pcButton"));
    ɵɵattribute("aria-expanded", ctx_r2.visible)("aria-haspopup", true)("aria-controls", ctx_r2.id + "_list")("aria-label", ctx_r2.ariaLabel)("aria-labelledby", ctx_r2.ariaLabelledBy);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r2.buttonIconClass && !ctx_r2.iconTemplate && !ctx_r2._iconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.iconTemplate || ctx_r2._iconTemplate);
  }
}
function SpeedDial_ng_container_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function SpeedDial_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, SpeedDial_ng_container_3_ng_container_1_Template, 1, 0, "ng-container", 11);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.buttonTemplate || ctx_r2._buttonTemplate)("ngTemplateOutletContext", ɵɵpureFunction1(2, _c5, ctx_r2.onButtonClick.bind(ctx_r2)));
  }
}
function SpeedDial_li_6_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function SpeedDial_li_6_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, SpeedDial_li_6_ng_container_1_ng_container_1_Template, 1, 0, "ng-container", 11);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    const item_r5 = ctx_r3.$implicit;
    const i_r6 = ctx_r3.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.itemTemplate || ctx_r2._itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction3(2, _c7, item_r5, i_r6, ctx_r2.onItemClick.bind(ctx_r2)));
  }
}
function SpeedDial_li_6_ng_container_2_span_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 15);
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext(2);
    const item_r5 = ctx_r3.$implicit;
    const i_r6 = ctx_r3.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(item_r5.icon);
    ɵɵproperty("pt", ctx_r2.getPTOptions(ctx_r2.id + "_" + i_r6, "actionIcon"));
  }
}
function SpeedDial_li_6_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = ɵɵgetCurrentView();
    ɵɵelementContainerStart(0);
    ɵɵelementStart(1, "button", 13);
    ɵɵlistener("click", function SpeedDial_li_6_ng_container_2_Template_button_click_1_listener($event) {
      ɵɵrestoreView(_r7);
      const item_r5 = ɵɵnextContext().$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onItemClick($event, item_r5));
    })("keydown.enter", function SpeedDial_li_6_ng_container_2_Template_button_keydown_enter_1_listener($event) {
      ɵɵrestoreView(_r7);
      const item_r5 = ɵɵnextContext().$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onItemClick($event, item_r5));
    });
    ɵɵtemplate(2, SpeedDial_li_6_ng_container_2_span_2_Template, 1, 3, "span", 14);
    ɵɵelementEnd();
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r3 = ɵɵnextContext();
    const item_r5 = ctx_r3.$implicit;
    const i_r6 = ctx_r3.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵclassMap(ctx_r2.cx("pcAction"));
    ɵɵproperty("rounded", true)("icon", item_r5.icon)("disabled", item_r5 == null ? null : item_r5.disabled)("pt", ctx_r2.getPTOptions(ctx_r2.id + "_" + i_r6, "pcAction"));
    ɵɵattribute("aria-label", item_r5.label)("tabindex", item_r5.disabled || !ctx_r2.visible ? null : item_r5.tabindex ? item_r5.tabindex : "0");
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r5.icon);
  }
}
function SpeedDial_li_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "li", 12);
    ɵɵtemplate(1, SpeedDial_li_6_ng_container_1_Template, 2, 6, "ng-container", 3)(2, SpeedDial_li_6_ng_container_2_Template, 3, 9, "ng-container", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r5 = ctx.$implicit;
    const i_r6 = ctx.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(ctx_r2.cx("item", ɵɵpureFunction2(10, _c6, item_r5, i_r6)));
    ɵɵproperty("pBind", ctx_r2.getPTOptions(ctx_r2.id + "_" + i_r6, "item"))("ngStyle", ctx_r2.getItemStyle(i_r6))("tooltipOptions", item_r5.tooltipOptions || ctx_r2.getTooltipOptions(item_r5))("id", ctx_r2.id + "_" + i_r6);
    ɵɵattribute("aria-controls", ctx_r2.id + "_item")("data-p-active", ctx_r2.isItemActive(ctx_r2.id + "_" + i_r6));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r2.itemTemplate || ctx_r2._itemTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r2.itemTemplate && !ctx_r2._itemTemplate);
  }
}
function SpeedDial_div_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "div", 2);
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(ctx_r2.cn(ctx_r2.cx("mask"), ctx_r2.maskClassName));
    ɵɵproperty("pBind", ctx_r2.ptm("mask"))("ngStyle", ctx_r2.maskStyle);
  }
}
var inlineStyles = {
  root: ({
    instance
  }) => ({
    alignItems: (instance.direction === "up" || instance.direction === "down") && "center",
    justifyContent: (instance.direction === "left" || instance.direction === "right") && "center",
    flexDirection: instance.direction === "up" ? "column-reverse" : instance.direction === "down" ? "column" : instance.direction === "left" ? "row-reverse" : instance.direction === "right" ? "row" : null
  }),
  list: ({
    instance
  }) => ({
    flexDirection: instance.direction === "up" ? "column-reverse" : instance.direction === "down" ? "column" : instance.direction === "left" ? "row-reverse" : instance.direction === "right" ? "row" : null
  })
};
var classes = {
  root: ({
    instance
  }) => [`p-speeddial p-component p-speeddial-${instance.type}`, {
    [`p-speeddial-direction-${instance.direction}`]: instance.type !== "circle",
    "p-speeddial-open": instance.visible,
    "p-disabled": instance.disabled
  }],
  pcButton: ({
    instance
  }) => ["p-button-icon-only p-speeddial-button p-button-rounded", {
    "p-speeddial-rotate": instance.rotateAnimation && !instance.hideIcon
  }],
  list: "p-speeddial-list",
  item: ({
    instance,
    item,
    i
  }) => ["p-speeddial-item", {
    "p-hidden": item.visible === false,
    "p-focus": instance.focusedOptionId == instance.id + "_" + i
  }],
  action: "p-speeddial-action",
  actionIcon: "p-speeddial-action-icon",
  mask: ({
    instance
  }) => ["p-speeddial-mask", {
    "p-speeddial-mask-visible": instance.visible
  }]
};
var SpeedDialStyle = class _SpeedDialStyle extends BaseStyle {
  name = "speeddial";
  style = style;
  classes = classes;
  inlineStyles = inlineStyles;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵSpeedDialStyle_BaseFactory;
    return function SpeedDialStyle_Factory(__ngFactoryType__) {
      return (ɵSpeedDialStyle_BaseFactory || (ɵSpeedDialStyle_BaseFactory = ɵɵgetInheritedFactory(_SpeedDialStyle)))(__ngFactoryType__ || _SpeedDialStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _SpeedDialStyle,
    factory: _SpeedDialStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpeedDialStyle, [{
    type: Injectable
  }], null, null);
})();
var SpeedDialClasses;
(function(SpeedDialClasses2) {
  SpeedDialClasses2["root"] = "p-speeddial";
  SpeedDialClasses2["pcButton"] = "p-speeddial-button";
  SpeedDialClasses2["list"] = "p-speeddial-list";
  SpeedDialClasses2["item"] = "p-speeddial-item";
  SpeedDialClasses2["action"] = "p-speeddial-action";
  SpeedDialClasses2["actionIcon"] = "p-speeddial-action-icon";
  SpeedDialClasses2["mask"] = "p-speeddial-mask";
})(SpeedDialClasses || (SpeedDialClasses = {}));
var SPEED_DIAL_INSTANCE = new InjectionToken("SPEED_DIAL_INSTANCE");
var SpeedDial = class _SpeedDial extends BaseComponent {
  $pcSpeedDial = inject(SPEED_DIAL_INSTANCE, {
    optional: true,
    skipSelf: true
  }) ?? void 0;
  bindDirectiveInstance = inject(Bind, {
    self: true
  });
  onAfterViewChecked() {
    this.bindDirectiveInstance.setAttrs(this.ptm("host"));
  }
  /**
   * List of items id.
   * @group Props
   */
  id;
  /**
   * MenuModel instance to define the action items.
   * @group Props
   */
  model = null;
  /**
   * Specifies the visibility of the overlay.
   * @defaultValue false
   * @group Props
   */
  get visible() {
    return this._visible;
  }
  set visible(value) {
    this._visible = value;
    if (this._visible) {
      this.bindDocumentClickListener();
    } else {
      this.unbindDocumentClickListener();
    }
  }
  /**
   * Inline style of the element.
   * @group Props
   */
  style;
  /**
   * Style class of the element.
   * @group Props
   */
  className;
  /**
   * Specifies the opening direction of actions.
   * @gruop Props
   */
  direction = "up";
  /**
   * Transition delay step for each action item.
   * @group Props
   */
  transitionDelay = 30;
  /**
   * Specifies the opening type of actions.
   * @group Props
   */
  type = "linear";
  /**
   * Radius for *circle types.
   * @group Props
   */
  radius = 0;
  /**
   * Whether to show a mask element behind the speeddial.
   * @group Props
   */
  mask = false;
  /**
   * Whether the component is disabled.
   * @group Props
   */
  disabled = false;
  /**
   * Whether the actions close when clicked outside.
   * @group Props
   */
  hideOnClickOutside = true;
  /**
   * Inline style of the button element.
   * @group Props
   */
  buttonStyle;
  /**
   * Style class of the button element.
   * @group Props
   */
  buttonClassName;
  /**
   * Inline style of the mask element.
   * @group Props
   */
  maskStyle;
  /**
   * Style class of the mask element.
   * @group Props
   */
  maskClassName;
  /**
   * Show icon of the button element.
   * @group Props
   */
  showIcon;
  /**
   * Hide icon of the button element.
   * @group Props
   */
  hideIcon;
  /**
   * Defined to rotate showIcon when hideIcon is not present.
   * @group Props
   */
  rotateAnimation = true;
  /**
   * Defines a string value that labels an interactive element.
   * @group Props
   */
  ariaLabel;
  /**
   * Identifier of the underlying input element.
   * @group Props
   */
  ariaLabelledBy;
  /**
   * Whether to display the tooltip on items. The modifiers of Tooltip can be used like an object in it. Valid keys are 'event' and 'position'.
   * @group Props
   */
  tooltipOptions;
  /**
   * Used to pass all properties of the ButtonProps to the Button component.
   * @group Props
   */
  buttonProps;
  /**
   * Fired when the visibility of element changed.
   * @param {boolean} boolean - Visibility value.
   * @group Emits
   */
  onVisibleChange = new EventEmitter();
  /**
   * Fired when the visibility of element changed.
   * @param {boolean} boolean - Visibility value.
   * @group Emits
   */
  visibleChange = new EventEmitter();
  /**
   * Fired when the button element clicked.
   * @param {MouseEvent} event - Mouse event.
   * @group Emits
   */
  onClick = new EventEmitter();
  /**
   * Fired when the actions are visible.
   * @param {Event} event - Browser event.
   * @group Emits
   */
  onShow = new EventEmitter();
  /**
   * Fired when the actions are hidden.
   * @param {Event} event - Browser event.
   * @group Emits
   */
  onHide = new EventEmitter();
  container;
  list;
  /**
   * Template of the button.
   * @group Templates
   */
  buttonTemplate;
  /**
   * Template of the item.
   * @group Templates
   */
  itemTemplate;
  /**
   * Template of the item.
   * @group Templates
   */
  iconTemplate;
  templates;
  _buttonTemplate;
  _itemTemplate;
  _iconTemplate;
  isItemClicked = false;
  _visible = false;
  documentClickListener;
  focusedOptionIndex = signal(null, ...ngDevMode ? [{
    debugName: "focusedOptionIndex"
  }] : []);
  focused = false;
  _componentStyle = inject(SpeedDialStyle);
  get focusedOptionId() {
    return this.focusedOptionIndex() !== -1 ? this.focusedOptionIndex() : null;
  }
  getTooltipOptions(item) {
    return __spreadProps(__spreadValues({}, this.tooltipOptions), {
      tooltipLabel: item.label,
      disabled: !this.tooltipOptions
    });
  }
  getPTOptions(id, key) {
    return this.ptm(key, {
      context: {
        active: this.isItemActive(id),
        hidden: !this.visible
      }
    });
  }
  isItemActive(id) {
    return id === this.focusedOptionId;
  }
  onInit() {
    this.id = this.id || s("pn_id_");
  }
  onAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.type !== "linear") {
        const button = z(this.container?.nativeElement, ".p-speeddial-button");
        const firstItem = z(this.list?.nativeElement, ".p-speeddial-item");
        if (button && firstItem) {
          const wDiff = Math.abs(button.offsetWidth - firstItem.offsetWidth);
          const hDiff = Math.abs(button.offsetHeight - firstItem.offsetHeight);
          this.list?.nativeElement.style.setProperty("--item-diff-x", `${wDiff / 2}px`);
          this.list?.nativeElement.style.setProperty("--item-diff-y", `${hDiff / 2}px`);
        }
      }
    }
  }
  onAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "button":
          this._buttonTemplate = item.template;
          break;
        case "item":
          this._itemTemplate = item.template;
          break;
        case "icon":
          this._iconTemplate = item.template;
          break;
      }
    });
  }
  show() {
    this.onVisibleChange.emit(true);
    this.visibleChange.emit(true);
    this._visible = true;
    this.onShow.emit();
    this.bindDocumentClickListener();
    this.cd.markForCheck();
  }
  hide() {
    this.onVisibleChange.emit(false);
    this.visibleChange.emit(false);
    this._visible = false;
    this.onHide.emit();
    this.unbindDocumentClickListener();
    this.cd.markForCheck();
  }
  onButtonClick(event) {
    this.visible ? this.hide() : this.show();
    this.onClick.emit(event);
    this.isItemClicked = true;
  }
  onItemClick(e, item) {
    if (item.command) {
      item.command({
        originalEvent: e,
        item
      });
    }
    this.hide();
    this.isItemClicked = true;
  }
  onKeyDown(event) {
    switch (event.code) {
      case "ArrowDown":
        this.onArrowDown(event);
        break;
      case "ArrowUp":
        this.onArrowUp(event);
        break;
      case "ArrowLeft":
        this.onArrowLeft(event);
        break;
      case "ArrowRight":
        this.onArrowRight(event);
        break;
      case "Enter":
      case "Space":
        this.onEnterKey(event);
        break;
      case "Escape":
        this.onEscapeKey(event);
        break;
      case "Home":
        this.onHomeKey(event);
        break;
      case "End":
        this.onEndKey(event);
        break;
      default:
        break;
    }
  }
  onFocus(event) {
    this.focused = true;
  }
  onBlur(event) {
    this.focused = false;
    asapScheduler.schedule(() => this.focusedOptionIndex.set(-1));
  }
  onArrowUp(event) {
    if (this.direction === "up") {
      this.navigateNextItem(event);
    } else if (this.direction === "down") {
      this.navigatePrevItem(event);
    } else {
      this.navigateNextItem(event);
    }
  }
  onArrowDown(event) {
    if (this.direction === "up") {
      this.navigatePrevItem(event);
    } else if (this.direction === "down") {
      this.navigateNextItem(event);
    } else {
      this.navigatePrevItem(event);
    }
  }
  onArrowLeft(event) {
    const leftValidDirections = ["left", "up-right", "down-left"];
    const rightValidDirections = ["right", "up-left", "down-right"];
    if (leftValidDirections.includes(this.direction || "")) {
      this.navigateNextItem(event);
    } else if (rightValidDirections.includes(this.direction || "")) {
      this.navigatePrevItem(event);
    } else {
      this.navigatePrevItem(event);
    }
  }
  onArrowRight(event) {
    const leftValidDirections = ["left", "up-right", "down-left"];
    const rightValidDirections = ["right", "up-left", "down-right"];
    if (leftValidDirections.includes(this.direction || "")) {
      this.navigatePrevItem(event);
    } else if (rightValidDirections.includes(this.direction || "")) {
      this.navigateNextItem(event);
    } else {
      this.navigateNextItem(event);
    }
  }
  onEndKey(event) {
    event.preventDefault();
    this.focusedOptionIndex.set(-1);
    this.navigatePrevItem(event);
  }
  onHomeKey(event) {
    event.preventDefault();
    this.focusedOptionIndex.set(-1);
    this.navigateNextItem(event);
  }
  onEnterKey(event) {
    const items = Y(this.container?.nativeElement, '[data-pc-section="item"]');
    const itemIndex = [...items].findIndex((item) => item.id === this.focusedOptionIndex());
    if (itemIndex !== -1 && this.model && this.model[itemIndex]) {
      this.onItemClick(event, this.model[itemIndex]);
    }
    this.onBlur(event);
    const buttonEl = z(this.container?.nativeElement, "button");
    buttonEl && bt(buttonEl);
  }
  onEscapeKey(event) {
    this.hide();
    const buttonEl = z(this.container?.nativeElement, "button");
    buttonEl && bt(buttonEl);
  }
  onTogglerKeydown(event) {
    switch (event.code) {
      case "ArrowDown":
      case "ArrowLeft":
        this.onTogglerArrowDown(event);
        break;
      case "ArrowUp":
      case "ArrowRight":
        this.onTogglerArrowUp(event);
        break;
      case "Escape":
        this.onEscapeKey(event);
        break;
      default:
        break;
    }
  }
  onTogglerArrowUp(event) {
    this.focused = true;
    bt(this.list?.nativeElement);
    this.show();
    this.navigatePrevItem(event);
    event.preventDefault();
  }
  onTogglerArrowDown(event) {
    this.focused = true;
    bt(this.list?.nativeElement);
    this.show();
    this.navigateNextItem(event);
    event.preventDefault();
  }
  navigateNextItem(event) {
    const optionIndex = this.findNextOptionIndex(this.focusedOptionIndex());
    this.changeFocusedOptionIndex(optionIndex);
    event.preventDefault();
  }
  navigatePrevItem(event) {
    const optionIndex = this.findPrevOptionIndex(this.focusedOptionIndex());
    this.changeFocusedOptionIndex(optionIndex);
    event.preventDefault();
  }
  findPrevOptionIndex(index) {
    const items = Y(this.container?.nativeElement, '[data-pc-section="item"]');
    const filteredItems = [...items].filter((item) => !R(z(item, "a"), "p-disabled"));
    const newIndex = index === -1 ? filteredItems[filteredItems.length - 1].id : index;
    let matchedOptionIndex = filteredItems.findIndex((link) => link.getAttribute("id") === newIndex);
    matchedOptionIndex = index === -1 ? filteredItems.length - 1 : matchedOptionIndex - 1;
    return matchedOptionIndex;
  }
  findNextOptionIndex(index) {
    const items = Y(this.container?.nativeElement, '[data-pc-section="item"]');
    const filteredItems = [...items].filter((item) => !R(z(item, "a"), "p-disabled"));
    const newIndex = index === -1 ? filteredItems[0].id : index;
    let matchedOptionIndex = filteredItems.findIndex((link) => link.getAttribute("id") === newIndex);
    matchedOptionIndex = index === -1 ? 0 : matchedOptionIndex + 1;
    return matchedOptionIndex;
  }
  changeFocusedOptionIndex(index) {
    const items = Y(this.container?.nativeElement, '[data-pc-section="item"]');
    const filteredItems = [...items].filter((item) => !R(z(item, "a"), "p-disabled"));
    if (filteredItems[index]) {
      this.focusedOptionIndex.set(filteredItems[index].getAttribute("id"));
    }
  }
  calculatePointStyle(index) {
    const type = this.type;
    if (type !== "linear") {
      const length = this.model.length;
      const radius = this.radius || length * 20;
      if (type === "circle") {
        const step = 2 * Math.PI / length;
        return {
          left: `calc(${radius * Math.cos(step * index)}px + var(--item-diff-x, 0px))`,
          top: `calc(${radius * Math.sin(step * index)}px + var(--item-diff-y, 0px))`
        };
      } else if (type === "semi-circle") {
        const direction = this.direction;
        const step = Math.PI / (length - 1);
        const x = `calc(${radius * Math.cos(step * index)}px + var(--item-diff-x, 0px))`;
        const y = `calc(${radius * Math.sin(step * index)}px + var(--item-diff-y, 0px))`;
        if (direction === "up") {
          return {
            left: x,
            bottom: y
          };
        } else if (direction === "down") {
          return {
            left: x,
            top: y
          };
        } else if (direction === "left") {
          return {
            right: y,
            top: x
          };
        } else if (direction === "right") {
          return {
            left: y,
            top: x
          };
        }
      } else if (type === "quarter-circle") {
        const direction = this.direction;
        const step = Math.PI / (2 * (length - 1));
        const x = `calc(${radius * Math.cos(step * index)}px + var(--item-diff-x, 0px))`;
        const y = `calc(${radius * Math.sin(step * index)}px + var(--item-diff-y, 0px))`;
        if (direction === "up-left") {
          return {
            right: x,
            bottom: y
          };
        } else if (direction === "up-right") {
          return {
            left: x,
            bottom: y
          };
        } else if (direction === "down-left") {
          return {
            right: y,
            top: x
          };
        } else if (direction === "down-right") {
          return {
            left: y,
            top: x
          };
        }
      }
    }
    return {};
  }
  calculateTransitionDelay(index) {
    const length = this.model.length;
    return (this.visible ? index : length - index - 1) * this.transitionDelay;
  }
  get buttonIconClass() {
    if (!this.visible && this.showIcon) {
      return this.showIcon;
    }
    if (this.visible && this.hideIcon) {
      return this.hideIcon;
    }
    return this.showIcon;
  }
  getItemStyle(index) {
    const transitionDelay = this.calculateTransitionDelay(index);
    const pointStyle = this.calculatePointStyle(index);
    return __spreadValues({
      transitionDelay: `${transitionDelay}ms`
    }, pointStyle);
  }
  isClickableRouterLink(item) {
    return item.routerLink && !this.disabled && !item.disabled;
  }
  isOutsideClicked(event) {
    return this.container && !(this.container.nativeElement.isSameNode(event.target) || this.container.nativeElement.contains(event.target) || this.isItemClicked);
  }
  bindDocumentClickListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentClickListener && this.hideOnClickOutside) {
        this.documentClickListener = this.renderer.listen(this.document, "click", (event) => {
          if (this.visible && this.isOutsideClicked(event)) {
            this.hide();
          }
          this.isItemClicked = false;
        });
      }
    }
  }
  unbindDocumentClickListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }
  onDestroy() {
    this.unbindDocumentClickListener();
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵSpeedDial_BaseFactory;
    return function SpeedDial_Factory(__ngFactoryType__) {
      return (ɵSpeedDial_BaseFactory || (ɵSpeedDial_BaseFactory = ɵɵgetInheritedFactory(_SpeedDial)))(__ngFactoryType__ || _SpeedDial);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _SpeedDial,
    selectors: [["p-speeddial"], ["p-speedDial"], ["p-speed-dial"]],
    contentQueries: function SpeedDial_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c0, 4);
        ɵɵcontentQuery(dirIndex, _c1, 4);
        ɵɵcontentQuery(dirIndex, _c2, 4);
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.buttonTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.itemTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.iconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function SpeedDial_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c3, 5);
        ɵɵviewQuery(_c4, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.container = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.list = _t.first);
      }
    },
    inputs: {
      id: "id",
      model: "model",
      visible: "visible",
      style: "style",
      className: "className",
      direction: "direction",
      transitionDelay: [2, "transitionDelay", "transitionDelay", numberAttribute],
      type: "type",
      radius: [2, "radius", "radius", numberAttribute],
      mask: [2, "mask", "mask", booleanAttribute],
      disabled: [2, "disabled", "disabled", booleanAttribute],
      hideOnClickOutside: [2, "hideOnClickOutside", "hideOnClickOutside", booleanAttribute],
      buttonStyle: "buttonStyle",
      buttonClassName: "buttonClassName",
      maskStyle: "maskStyle",
      maskClassName: "maskClassName",
      showIcon: "showIcon",
      hideIcon: "hideIcon",
      rotateAnimation: [2, "rotateAnimation", "rotateAnimation", booleanAttribute],
      ariaLabel: "ariaLabel",
      ariaLabelledBy: "ariaLabelledBy",
      tooltipOptions: "tooltipOptions",
      buttonProps: "buttonProps"
    },
    outputs: {
      onVisibleChange: "onVisibleChange",
      visibleChange: "visibleChange",
      onClick: "onClick",
      onShow: "onShow",
      onHide: "onHide"
    },
    features: [ɵɵProvidersFeature([SpeedDialStyle, {
      provide: SPEED_DIAL_INSTANCE,
      useExisting: _SpeedDial
    }, {
      provide: PARENT_INSTANCE,
      useExisting: _SpeedDial
    }]), ɵɵHostDirectivesFeature([Bind]), ɵɵInheritDefinitionFeature],
    decls: 8,
    vars: 17,
    consts: [["container", ""], ["list", ""], [3, "pBind", "ngStyle"], [4, "ngIf"], ["role", "menu", 3, "focus", "focusout", "keydown", "pBind", "id", "tabindex", "ngStyle"], ["pTooltip", "", "role", "menuitem", 3, "pBind", "ngStyle", "class", "tooltipOptions", "id", 4, "ngFor", "ngForOf"], [3, "pBind", "class", "ngStyle", 4, "ngIf"], ["type", "button", "pButton", "", "pRipple", "", 3, "click", "keydown", "icon", "disabled", "buttonProps", "pt"], ["data-p-icon", "plus", "pButtonIcon", "", 3, "pt", 4, "ngIf"], [4, "ngTemplateOutlet"], ["data-p-icon", "plus", "pButtonIcon", "", 3, "pt"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], ["pTooltip", "", "role", "menuitem", 3, "pBind", "ngStyle", "tooltipOptions", "id"], ["type", "button", "pButton", "", "pRipple", "", "severity", "secondary", "size", "small", "role", "menuitem", 3, "click", "keydown.enter", "rounded", "icon", "disabled", "pt"], ["pButtonIcon", "", 3, "pt", "class", 4, "ngIf"], ["pButtonIcon", "", 3, "pt"]],
    template: function SpeedDial_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = ɵɵgetCurrentView();
        ɵɵelementStart(0, "div", 2, 0);
        ɵɵtemplate(2, SpeedDial_ng_container_2_Template, 4, 15, "ng-container", 3)(3, SpeedDial_ng_container_3_Template, 2, 4, "ng-container", 3);
        ɵɵelementStart(4, "ul", 4, 1);
        ɵɵlistener("focus", function SpeedDial_Template_ul_focus_4_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onFocus($event));
        })("focusout", function SpeedDial_Template_ul_focusout_4_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onBlur($event));
        })("keydown", function SpeedDial_Template_ul_keydown_4_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onKeyDown($event));
        });
        ɵɵtemplate(6, SpeedDial_li_6_Template, 3, 13, "li", 5);
        ɵɵelementEnd()();
        ɵɵtemplate(7, SpeedDial_div_7_Template, 1, 4, "div", 6);
      }
      if (rf & 2) {
        ɵɵstyleMap(ctx.style);
        ɵɵclassMap(ctx.cn(ctx.cx("root"), ctx.className));
        ɵɵproperty("pBind", ctx.ptm("root"))("ngStyle", ctx.sx("root"));
        ɵɵadvance(2);
        ɵɵproperty("ngIf", !ctx.buttonTemplate && !ctx._buttonTemplate);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.buttonTemplate || ctx._buttonTemplate);
        ɵɵadvance();
        ɵɵclassMap(ctx.cx("list"));
        ɵɵproperty("pBind", ctx.ptm("list"))("id", ctx.id + "_list")("tabindex", -1)("ngStyle", ctx.sx("list"));
        ɵɵattribute("aria-activedescendant", ctx.focused ? ctx.focusedOptionId : void 0);
        ɵɵadvance(2);
        ɵɵproperty("ngForOf", ctx.model);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.mask && ctx.visible);
      }
    },
    dependencies: [CommonModule, NgForOf, NgIf, NgTemplateOutlet, NgStyle, ButtonModule, ButtonDirective, ButtonIcon, Ripple, TooltipModule, Tooltip, Bind, RouterModule, PlusIcon, SharedModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpeedDial, [{
    type: Component,
    args: [{
      selector: "p-speeddial, p-speedDial, p-speed-dial",
      standalone: true,
      imports: [CommonModule, ButtonModule, Ripple, TooltipModule, RouterModule, PlusIcon, SharedModule, Bind],
      template: `
        <div #container [pBind]="ptm('root')" [class]="cn(cx('root'), className)" [style]="style" [ngStyle]="sx('root')">
            <ng-container *ngIf="!buttonTemplate && !_buttonTemplate">
                <button
                    type="button"
                    pButton
                    pRipple
                    [style]="buttonStyle"
                    [icon]="buttonIconClass"
                    [class]="cn(cx('pcButton'), buttonClassName)"
                    [disabled]="disabled"
                    [attr.aria-expanded]="visible"
                    [attr.aria-haspopup]="true"
                    [attr.aria-controls]="id + '_list'"
                    [attr.aria-label]="ariaLabel"
                    [attr.aria-labelledby]="ariaLabelledBy"
                    (click)="onButtonClick($event)"
                    (keydown)="onTogglerKeydown($event)"
                    [buttonProps]="buttonProps"
                    [pt]="ptm('pcButton')"
                >
                    <svg data-p-icon="plus" pButtonIcon [pt]="ptm('pcButton')['icon']" *ngIf="!buttonIconClass && !iconTemplate && !_iconTemplate" />
                    <ng-container *ngTemplateOutlet="iconTemplate || _iconTemplate"></ng-container>
                </button>
            </ng-container>
            <ng-container *ngIf="buttonTemplate || _buttonTemplate">
                <ng-container *ngTemplateOutlet="buttonTemplate || _buttonTemplate; context: { toggleCallback: onButtonClick.bind(this) }"></ng-container>
            </ng-container>
            <ul
                #list
                [pBind]="ptm('list')"
                [class]="cx('list')"
                role="menu"
                [id]="id + '_list'"
                (focus)="onFocus($event)"
                (focusout)="onBlur($event)"
                (keydown)="onKeyDown($event)"
                [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
                [tabindex]="-1"
                [ngStyle]="sx('list')"
            >
                <li
                    *ngFor="let item of model; let i = index"
                    [pBind]="getPTOptions(id + '_' + i, 'item')"
                    [ngStyle]="getItemStyle(i)"
                    [class]="cx('item', { item, i })"
                    pTooltip
                    [tooltipOptions]="item.tooltipOptions || getTooltipOptions(item)"
                    [id]="id + '_' + i"
                    [attr.aria-controls]="id + '_item'"
                    role="menuitem"
                    [attr.data-p-active]="isItemActive(id + '_' + i)"
                >
                    <ng-container *ngIf="itemTemplate || _itemTemplate">
                        <ng-container *ngTemplateOutlet="itemTemplate || _itemTemplate; context: { $implicit: item, index: i, toggleCallback: onItemClick.bind(this) }"></ng-container>
                    </ng-container>
                    <ng-container *ngIf="!itemTemplate && !_itemTemplate">
                        <button
                            type="button"
                            pButton
                            pRipple
                            [class]="cx('pcAction')"
                            severity="secondary"
                            [rounded]="true"
                            size="small"
                            role="menuitem"
                            [icon]="item.icon"
                            (click)="onItemClick($event, item)"
                            [disabled]="item?.disabled"
                            (keydown.enter)="onItemClick($event, item)"
                            [attr.aria-label]="item.label"
                            [attr.tabindex]="item.disabled || !visible ? null : item.tabindex ? item.tabindex : '0'"
                            [pt]="getPTOptions(id + '_' + i, 'pcAction')"
                        >
                            <span *ngIf="item.icon" pButtonIcon [pt]="getPTOptions(id + '_' + i, 'actionIcon')" [class]="item.icon"></span>
                        </button>
                    </ng-container>
                </li>
            </ul>
        </div>
        <div *ngIf="mask && visible" [pBind]="ptm('mask')" [class]="cn(cx('mask'), maskClassName)" [ngStyle]="maskStyle"></div>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [SpeedDialStyle, {
        provide: SPEED_DIAL_INSTANCE,
        useExisting: SpeedDial
      }, {
        provide: PARENT_INSTANCE,
        useExisting: SpeedDial
      }],
      hostDirectives: [Bind]
    }]
  }], null, {
    id: [{
      type: Input
    }],
    model: [{
      type: Input
    }],
    visible: [{
      type: Input
    }],
    style: [{
      type: Input
    }],
    className: [{
      type: Input
    }],
    direction: [{
      type: Input
    }],
    transitionDelay: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    type: [{
      type: Input
    }],
    radius: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    mask: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    hideOnClickOutside: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    buttonStyle: [{
      type: Input
    }],
    buttonClassName: [{
      type: Input
    }],
    maskStyle: [{
      type: Input
    }],
    maskClassName: [{
      type: Input
    }],
    showIcon: [{
      type: Input
    }],
    hideIcon: [{
      type: Input
    }],
    rotateAnimation: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    ariaLabel: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    tooltipOptions: [{
      type: Input
    }],
    buttonProps: [{
      type: Input
    }],
    onVisibleChange: [{
      type: Output
    }],
    visibleChange: [{
      type: Output
    }],
    onClick: [{
      type: Output
    }],
    onShow: [{
      type: Output
    }],
    onHide: [{
      type: Output
    }],
    container: [{
      type: ViewChild,
      args: ["container"]
    }],
    list: [{
      type: ViewChild,
      args: ["list"]
    }],
    buttonTemplate: [{
      type: ContentChild,
      args: ["button", {
        descendants: false
      }]
    }],
    itemTemplate: [{
      type: ContentChild,
      args: ["item", {
        descendants: false
      }]
    }],
    iconTemplate: [{
      type: ContentChild,
      args: ["icon", {
        descendants: false
      }]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var SpeedDialModule = class _SpeedDialModule {
  static ɵfac = function SpeedDialModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SpeedDialModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _SpeedDialModule,
    imports: [SpeedDial, SharedModule],
    exports: [SpeedDial, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [SpeedDial, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpeedDialModule, [{
    type: NgModule,
    args: [{
      imports: [SpeedDial, SharedModule],
      exports: [SpeedDial, SharedModule]
    }]
  }], null, null);
})();
export {
  SpeedDial,
  SpeedDialClasses,
  SpeedDialModule,
  SpeedDialStyle
};
//# sourceMappingURL=primeng_speeddial.js.map
