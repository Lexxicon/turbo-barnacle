export class Input {
    public pressed: { [code: number]: boolean | undefined } = {};

    constructor() {
        this.onKeyDown = (e: KeyboardEvent) => {
            if (!this.pressed[e.keyCode]) {
                this.keyHandler(e.keyCode);
            }
            this.pressed[e.keyCode] = true;
        };
        this.onKeyUp = (e: KeyboardEvent) => {
            this.pressed[e.keyCode] = false;
        };
        this.contextMenu = (e: PointerEvent) => {
            e.preventDefault();
        };
        this.dispose = () => {
            document.removeEventListener("contextmenu", this.contextMenu);
            window.removeEventListener("keydown", this.onKeyDown);
            window.removeEventListener("keyup", this.onKeyUp);
        };

        document.addEventListener("contextmenu", this.contextMenu, false);
        window.addEventListener("keydown", this.onKeyDown, false);
        window.addEventListener("keyup", this.onKeyUp, false);
    }

    public dispose: () => void;

    public onKeyDown(e: KeyboardEvent) {
        if (!this.pressed[e.keyCode]) {
            this.keyHandler(e.keyCode);
        }
        this.pressed[e.keyCode] = true;
    }

    public onKeyUp: (e: KeyboardEvent) => void;

    public contextMenu: (e: PointerEvent) => void;

    public keyHandler(key: number) {
        //
    }
}
