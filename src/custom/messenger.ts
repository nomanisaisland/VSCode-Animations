import { FocusDimMode } from "./handlers/focusHandler";

export interface MessengerData {
  settings: {
    cursorAnimation: {
      enabled: boolean;
      color: string;
      cursorStyle: "block" | "line";
      trailLength: number;
    };
    focus: {
      mode: FocusDimMode;
      amount: number;
      duration: number;
    };
  };
  css: string;
}

export class Messenger {
  private _messengerElement!: HTMLElement | null;

  constructor(handlers: {
    onLoad: (data: MessengerData) => void;
    onUpdate: (data: MessengerData) => void;
  }) {
    const interval = setInterval(() => {
      this._messengerElement = document.getElementById(
        "BrandonKirbyson.vscode-animations-plus"
      );

      // If not found by ID, scan ALL elements with aria-label
      if (!this._messengerElement) {
        const items = document.querySelectorAll("[aria-label]");
        for (const el of Array.from(items)) {
          const label = el.getAttribute("aria-label");
          if (label && label.includes('{"settings":') && label.includes('"css":')) {
            console.log("VSCode Animations Plus: Found messenger by aria-label content match.");
            this._messengerElement = el as HTMLElement;
            break;
          }
        }
      }

      if (this._messengerElement) {
        const content = this._messengerElement.getAttribute("aria-label");
        if (content && content !== "") {
          console.log("VSCode Animations Plus: Messenger found and data received!");
          clearInterval(interval);
          handlers.onLoad(this.data);

          const observer = new MutationObserver((mutations: any) => {
            mutations.forEach((mutation: any) => {
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "aria-label"
              ) {
                handlers.onUpdate(this.data);
              }
            });
          });
          observer.observe(this._messengerElement, {
            attributes: true,
          });
        }
      }
    }, 100);
  }

  public get data(): MessengerData {
    const content = this._messengerElement?.getAttribute("aria-label");

    const defaultData: MessengerData = {
      settings: {
        cursorAnimation: {
          enabled: false,
          color: "#ffffff",
          cursorStyle: "line",
          trailLength: 8,
        },
        focus: {
          mode: FocusDimMode.window,
          amount: 50,
          duration: 200,
        },
      },
      css: "",
    };

    if (!content) {
      return defaultData;
    }

    const parsedData = JSON.parse(content);

    if (!parsedData) {
      return defaultData;
    }

    return parsedData;
  }
}
