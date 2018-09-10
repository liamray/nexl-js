/* SystemJS module definition */
declare var module: NodeModule;

interface NodeModule {
  id: string;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare var ace: any;

declare var UI_CONSTANTS: any;
declare var CONF_CONSTANTS: any;
declare var SECURITY_CONSTANTS: any;
declare var REST_URLS: any;
declare var COMMON_UTILS: any;
declare var DI_CONSTANTS: any;
declare var CodeMirror: any;

declare var jsBeautify: (content: string, opts?: any) => {};
