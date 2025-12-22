
declare module ADDONS {


    /**
     * Abstract Node class from Babylon.js
     */
    export interface INodeLike {
        getWorldMatrix(): BABYLON.IMatrixLike;
    }
    /**
     * Class used to render text using MSDF (Multi-channel Signed Distance Field) technique
     * Thanks a lot to the work of Bhushan_Wagh and zb_sj for their amazing work on MSDF for Babylon.js
     * #6RLCWP#16
     * Star wars scroller: #6RLCWP#29
     * With metrics: #6RLCWP#35
     * Thickness: #IABMEZ#3
     * Solar system: #9YCDYC#9
     * Stroke: #6RLCWP#37
     */
    export class TextRenderer implements BABYLON.IDisposable {
        private readonly _useVAO;
        private _engine;
        private _shaderLanguage;
        private _vertexBuffers;
        private _spriteBuffer;
        private _worldBuffer;
        private _uvBuffer;
        private _drawWrapperBase;
        private _vertexArrayObject;
        private _font;
        private _charMatrices;
        private _charUvs;
        private _isDirty;
        private _baseLine;
        private _scalingMatrix;
        private _fontScaleMatrix;
        private _offsetMatrix;
        private _translationMatrix;
        private _baseMatrix;
        private _scaledMatrix;
        private _localMatrix;
        private _finalMatrix;
        private _lineMatrix;
        private _parentWorldMatrix;
        /**
         * Gets or sets the color of the text
         */
        color: BABYLON.IColor4Like;
        /**
         * Gets or sets the color of the stroke around the text
         */
        strokeColor: BABYLON.IColor4Like;
        /**
         * Gets or sets the width of the stroke around the text (inset)
         */
        strokeInsetWidth: number;
        /**
         * Gets or sets the width of the stroke around the text (outset)
         */
        strokeOutsetWidth: number;
        /**
         * Gets or sets the thickness of the text (0 means as defined in the font)
         * Value must be between -0.5 and 0.5
         */
        thicknessControl: number;
        private _parent;
        /**
         * Gets or sets the parent of the text renderer
         */
        get parent(): BABYLON.Nullable<INodeLike>;
        set parent(value: BABYLON.Nullable<INodeLike>);
        private _transformMatrix;
        /**
         * Gets or sets the transform matrix of the text renderer
         * It will be applied in that order:
         * parent x transform x paragraph world
         */
        get transformMatrix(): BABYLON.IMatrixLike;
        set transformMatrix(value: BABYLON.IMatrixLike);
        /**
         * Gets or sets if the text is billboarded
         */
        isBillboard: boolean;
        /**
         * Gets or sets if the text is screen projected
         * This will work only if the text is billboarded
         */
        isBillboardScreenProjected: boolean;
        /**
         * Gets the number of characters in the text renderer
         */
        get characterCount(): number;
        /**
         * Gets or sets if the text renderer should ignore the depth buffer
         * Default is false
         */
        ignoreDepthBuffer: boolean;
        private constructor();
        private _resizeBuffers;
        private _setShaders;
        /**
         * Add a paragraph of text to the renderer
         * @param text define the text to add
         * @param options define the options to use for the paragraph (optional)
         * @param worldMatrix define the world matrix to use for the paragraph (optional)
         */
        addParagraph(text: string, options?: Partial<ParagraphOptions>, worldMatrix?: BABYLON.IMatrixLike): void;
        /**
         * Render the text using the provided view and projection matrices
         * @param viewMatrix define the view matrix to use
         * @param projectionMatrix define the projection matrix to use
         */
        render(viewMatrix: BABYLON.IMatrixLike, projectionMatrix: BABYLON.IMatrixLike): void;
        /**
         * Release associated resources
         */
        dispose(): void;
        /**
         * Creates a new TextRenderer instance asynchronously
         * @param font define the font asset to use
         * @param engine define the engine to use
         * @returns a promise that resolves to the created TextRenderer instance
         */
        static CreateTextRendererAsync(font: FontAsset, engine: BABYLON.AbstractEngine): Promise<TextRenderer>;
    }


    /** @internal */
    export type ParagraphOptions = {
        maxWidth: number;
        lineHeight: number;
        letterSpacing: number;
        tabSize: number;
        whiteSpace: "pre-line";
        textAlign: "left" | "right" | "center";
        translate: BABYLON.IVector2Like | undefined;
    };
    /** @internal */
    export var DefaultParagraphOptions: ParagraphOptions;




    /**
     * Class representing a font asset for SDF (Signed Distance Field) rendering.
     */
    export class FontAsset implements BABYLON.IDisposable {
        private readonly _chars;
        private readonly _charsRegex;
        private readonly _kernings;
        /** @internal */
        readonly _font: SdfFont;
        /**
         * Gets the font scale value
         */
        readonly scale: number;
        /**
         * Gets the list of used textures
         */
        readonly textures: BABYLON.Texture[];
        /**
         * Creates a new FontAsset instance.
         * @param definitionData defines the font data in JSON format.
         * @param textureUrl defines the url of the texture to use for the font.
         * @param scene defines the hosting scene.
         */
        constructor(definitionData: string, textureUrl: string, scene?: BABYLON.Scene);
        dispose(): void;
        private _updateFallbacks;
        /** @internal */
        _getChar(charCode: number): BMFontChar;
        /** @internal */
        _getKerning(first: number, second: number): number;
        /** @internal */
        _unsupportedChars(text: string): string;
    }


    /** @internal */
    export var msdfVertexShaderWGSL: {
        name: string;
        shader: string;
    };


    /** @internal */
    export var msdfPixelShaderWGSL: {
        name: string;
        shader: string;
    };


    /** @internal */
    export var msdfVertexShader: {
        name: string;
        shader: string;
    };


    /** @internal */
    export var msdfPixelShader: {
        name: string;
        shader: string;
    };


    /** @internal */
    export class SdfTextParagraph {
        readonly text: string;
        readonly fontAsset: FontAsset;
        readonly options: ParagraphOptions;
        get lineHeight(): number;
        readonly paragraph: string;
        readonly lines: SdfTextLine[];
        readonly width: number;
        readonly height: number;
        readonly glyphs: SdfGlyph[];
        constructor(text: string, fontAsset: FontAsset, options?: Partial<ParagraphOptions>);
        private _computeMetrics;
        private _breakLines;
        private _collapse;
        private _wrap;
    }


    /** @internal */
    export type SdfTextLine = {
        text: string;
        glyphs: SdfGlyph[];
        start: number;
        end: number;
        width: number;
    };




    /** @internal */
    export type SdfGlyph = {
        char: BMFontChar;
        /** index of the line */
        line: number;
        /** position within the line */
        position: number;
        x: number;
        y: number;
    };


    export type SdfFontDistanceField = {
        fieldType: "sdf" | "msdf";
        distanceRange: number;
    };
    export type SdfFont = BMFont & {
        distanceField: SdfFontDistanceField;
    };


    /**
     * Holds information on how the font was generated.
     */
    export type BMFontInfo = {
        /** The name of the font */
        face: string;
        /** The size of the font */
        size: number;
        /** The font is bold */
        bold: number;
        /** The font is italic */
        italic: number;
        /** The charset of the font */
        charset: string[];
        /** The charset is unicode  */
        unicode: number;
        /** The font height stretch in percentage. 100% means no stretch. */
        stretchH: number;
        /** Set to 1 if smoothing was turned on. */
        smooth: number;
        /** The supersampling level used. 1 means no supersampling was used. */
        aa: number;
        /** The padding for each character (up, right, down, left). */
        padding: [number, number, number, number];
        /** The spacing for each character (horizontal, vertical). */
        spacing: [number, number];
        /**
         * The outline thickness for the characters.
         *
         * @remark missing in msdf-bmfont-xml
         */
        outline?: number;
    };
    /**
     * Holds information common to all characters.
     */
    export type BMFontCommon = {
        /** Distance in pixels between each line of text */
        lineHeight: number;
        /** The number of pixels from the absolute top of the line to the base of the characters */
        base: number;
        /** The width of the texture, normally used to scale the x pos of the character image */
        scaleW: number;
        /** The height of the texture, normally used to scale the y pos of the character image */
        scaleH: number;
        /** The number of pages in the font */
        pages: number;
        /** Set to 1 if the monochrome characters have been packed into each of the texture channels. In this case alphaChnl describes what is stored in each channel. */
        packed: number;
        /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
        alphaChnl: number;
        /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
        redChnl: number;
        /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
        greenChnl: number;
        /** Set to 0 if the channel holds the glyph data, 1 if it holds the outline, 2 if it holds the glyph and the outline, 3 if its set to zero, and 4 if its set to one. */
        blueChnl: number;
    };
    /** Name of a texture file. There is one for each page in the font. */
    export type BMFontPages = {
        [id: number]: string;
    } & Array<string>;
    /**
     * Describes a single character in the font
     */
    export type BMFontChar = {
        /** Character id (charCode) */
        id: number;
        /** Left position of the character image in the texture. */
        x: number;
        /** Right position of the character image in the texture */
        y: number;
        /** Width of the chracter image in the texture */
        width: number;
        /** Height of the chracter image in the texture */
        height: number;
        /** Horizontal offset to be applied on screen */
        xoffset: number;
        /** Vertical offset to be applied on screen */
        yoffset: number;
        /** Horizontal advance after the character */
        xadvance: number;
        /** Page index where the character image is found */
        page: number;
        /** Texture channel where the chracter image is found
         * - 1 = blue
         * - 2 = green
         * - 3 = red
         * - 8 = alpha
         * - 15 = all channels
         */
        chnl: number;
    } & BMFontCharExtra;
    /**
     * additional context from msdf-bmfont-xml
     */
    export type BMFontCharExtra = {
        /** index of opentype.js glyph */
        index: number;
        /** actual character*/
        char: string;
    };
    /**
     * The kerning information is used to adjust the distance between certain characters, e.g. some characters should be placed closer to each other than others.
     */
    export type BMFontKerning = {
        /** The first character id. */
        first: number;
        /** The second character id. */
        second: number;
        /** How much the x position should be adjusted when drawing the second character immediately following the first. */
        amount: number;
    };
    /**
     * Compatible with [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml)
     * @see https://www.angelcode.com/products/bmfont/doc/file_format.html
     */
    export type BMFont = {
        /** {@inheritDoc BMFontInfo} */
        info: BMFontInfo;
        /** {@inheritDoc BMFontCommon} */
        common: BMFontCommon;
        /** {@inheritDoc BMFontPages} */
        pages: BMFontPages;
        /** {@inheritDoc BMFontChar} */
        chars: BMFontChar[];
        /** {@inheritDoc BMFontKerning} */
        kernings: BMFontKerning[];
    };


    /**
     * BABYLON.Behavior for any content that can capture pointer events, i.e. bypass the Babylon pointer event handling
     * and receive pointer events directly.  It will register the capture triggers and negotiate the capture and
     * release of pointer events.  Curerntly this applies only to HtmlMesh
     */
    export class PointerEventsCaptureBehavior implements BABYLON.Behavior<BABYLON.AbstractMesh> {
        private _captureCallback;
        private _releaseCallback;
        /** gets or sets behavior's name */
        name: string;
        private _attachedMesh;
        /** @internal */
        _captureOnPointerEnter: boolean;
        /**
         * Gets or sets the mesh that the behavior is attached to
         */
        get attachedMesh(): BABYLON.AbstractMesh | null;
        set attachedMesh(value: BABYLON.AbstractMesh | null);
        constructor(_captureCallback: () => void, _releaseCallback: () => void, { captureOnPointerEnter }?: {
            captureOnPointerEnter?: boolean | undefined;
        });
        /**
         * Set if the behavior should capture pointer events when the pointer enters the mesh
         */
        set captureOnPointerEnter(captureOnPointerEnter: boolean);
        /**
         * Function called when the behavior needs to be initialized (before attaching it to a target)
         */
        init(): void;
        /**
         * Called when the behavior is attached to a target
         * @param mesh defines the target where the behavior is attached to
         */
        attach(mesh: BABYLON.AbstractMesh): void;
        /**
         * Called when the behavior is detached from its target
         */
        detach(): void;
        /**
         * Dispose the behavior
         */
        dispose(): void;
        releasePointerEvents(): void;
        capturePointerEvents(): void;
    }


    type CaptureReleaseCallback = () => void;
    /**
     * Get the id of the object currently capturing pointer events
     * @returns The id of the object currently capturing pointer events
     * or null if no object is capturing pointer events
     */
    export const getCapturingId: () => string | null;
    /**
     * Request that the object with the given id capture pointer events.  If there is no current
     * owner, then the request is granted immediately.  If there is a current owner, then the request
     * is queued until the current owner releases pointer events.
     * @param requestId An id to identify the request.  This id will be used to match the capture
     * request with the release request.
     * @param captureCallback The callback to call when the request is granted and the object is capturing
     * @param releaseCallback The callback to call when the object is no longer capturing pointer events
     */
    export const requestCapture: (requestId: string, captureCallback: CaptureReleaseCallback, releaseCallback: CaptureReleaseCallback) => void;
    /**
     * Release pointer events from the object with the given id.  If the object is the current owner
     * then pointer events are released immediately.  If the object is not the current owner, then the
     * associated capture request is removed from the queue.  If there is no matching capture request
     * in the queue, then the release request is added to a list of unmatched release requests and will
     * negate the next capture request with the same id.  This is to guard against the possibility that
     * the release request arrived before the capture request.
     * @param requestId The id which should match the id of the capture request
     */
    export const requestRelease: (requestId: string | null) => void;
    /**
     * Release pointer events from the current owner
     */
    export const releaseCurrent: () => void;
   }

        interface Window {
            "pointer-events-capture-debug": boolean | null;
        }
    declare module ADDONS {
    



    /**
     * A function that compares two submeshes and returns a number indicating which
     * should be rendered first.
     */
    type RenderOrderFunction = (subMeshA: BABYLON.SubMesh, subMeshB: BABYLON.SubMesh) => number;
    /**
     * An instance of this is required to render HtmlMeshes in the scene.
     * if using HtmlMeshes, you must not set render order for group 0 using
     * scene.setRenderingOrder.  You must instead pass the compare functions
     * to the HtmlMeshRenderer constructor.  If you do not, then your render
     * order will be overwritten if the HtmlMeshRenderer is created after and
     * the HtmlMeshes will not render correctly (they will appear in front of
     * meshes that are actually in front of them) if the HtmlMeshRenderer is
     * created before.
     */
    export class HtmlMeshRenderer {
        private _containerId?;
        private _inSceneElements?;
        private _overlayElements?;
        private _engine;
        private _cache;
        private _width;
        private _height;
        private _heightHalf;
        private _cameraWorldMatrix?;
        private _temp;
        private _lastDevicePixelRatio;
        private _cameraMatrixUpdated;
        private _previousCanvasDocumentPosition;
        private _renderObserver;
        /**
         * Contruct an instance of HtmlMeshRenderer
         * @param scene
         * @param options object containing the following optional properties:
         * @returns
         */
        constructor(scene: BABYLON.Scene, { parentContainerId, _containerId, enableOverlayRender, defaultOpaqueRenderOrder, defaultAlphaTestRenderOrder, defaultTransparentRenderOrder, }?: {
            parentContainerId?: string | null;
            _containerId?: string;
            defaultOpaqueRenderOrder?: RenderOrderFunction;
            defaultAlphaTestRenderOrder?: RenderOrderFunction;
            defaultTransparentRenderOrder?: RenderOrderFunction;
            enableOverlayRender?: boolean;
        });
        /**
         * Dispose of the HtmlMeshRenderer
         */
        dispose(): void;
        protected _init(scene: BABYLON.Scene, parentContainerId: string | null, enableOverlayRender: boolean, defaultOpaqueRenderOrder: RenderOrderFunction, defaultAlphaTestRenderOrder: RenderOrderFunction, defaultTransparentRenderOrder: RenderOrderFunction): void;
        private _createRenderLayerElements;
        protected _getSize(): {
            width: number;
            height: number;
        };
        protected _setSize(width: number, height: number): void;
        protected _getCameraCssMatrix(matrix: BABYLON.Matrix): string;
        protected _getHtmlContentCssMatrix(matrix: BABYLON.Matrix, useRightHandedSystem: boolean): string;
        protected _getTransformationMatrix(htmlMesh: HtmlMesh, useRightHandedSystem: boolean): BABYLON.Matrix;
        protected _renderHtmlMesh(htmlMesh: HtmlMesh, useRightHandedSystem: boolean): void;
        protected _render(scene: BABYLON.Scene, camera: BABYLON.Camera): void;
        protected _updateBaseScaleFactor(htmlMesh: HtmlMesh): void;
        protected _updateContainerPositionIfNeeded(): void;
        protected _onCameraMatrixChanged: (camera: BABYLON.Camera) => void;
        private _epsilon;
        private _getAncestorMarginsAndPadding;
    }


    /**
     * This class represents HTML content that we want to render as though it is part of the scene.  The HTML content is actually
     * rendered below the canvas, but a depth mask is created by this class that writes to the depth buffer but does not
     * write to the color buffer, effectively punching a hole in the canvas.  CSS transforms are used to scale, translate, and rotate
     * the HTML content so that it matches the camera and mesh orientation.  The class supports interactions in editable and non-editable mode.
     * In non-editable mode (the default), events are passed to the HTML content when the pointer is over the mask (and not occluded by other meshes
     * in the scene).
     * @see https://playground.babylonjs.com/#HVHYJC#5
     * @see https://playground.babylonjs.com/#B17TC7#112
     */
    export class HtmlMesh extends BABYLON.Mesh {
        /**
         * Helps identifying a html mesh from a regular mesh
         */
        get isHtmlMesh(): boolean;
        private _enabled;
        private _ready;
        /**
         * @internal
         */
        _isCanvasOverlay: boolean;
        private _requiresUpdate;
        private _element?;
        private _width?;
        private _height?;
        private _inverseScaleMatrix;
        private _captureOnPointerEnter;
        private _pointerEventCaptureBehavior;
        private _sourceWidth;
        private _sourceHeight;
        /**
         * Return the source width of the content in pixels
         */
        get sourceWidth(): number | null;
        /**
         * Return the source height of the content in pixels
         */
        get sourceHeight(): number | null;
        private _worldMatrixUpdateObserver;
        private _fitStrategy;
        /**
         * Contruct an instance of HtmlMesh
         * @param scene
         * @param id The id of the mesh.  Will be used as the id of the HTML element as well.
         * @param options object with optional parameters
         */
        constructor(scene: BABYLON.Scene, id: string, { captureOnPointerEnter, isCanvasOverlay, fitStrategy }?: {
            captureOnPointerEnter?: boolean | undefined;
            isCanvasOverlay?: boolean | undefined;
            fitStrategy?: FitStrategyType | undefined;
        });
        /**
         * The width of the content in pixels
         */
        get width(): number | undefined;
        /**
         * The height of the content in pixels
         */
        get height(): number | undefined;
        /**
         * The HTML element that is being rendered as a mesh
         */
        get element(): HTMLElement | undefined;
        /**
         * True if the mesh has been moved, rotated, or scaled since the last time this
         * property was read.  This property is reset to false after reading.
         */
        get requiresUpdate(): boolean;
        /**
         * Enable capture for the pointer when entering the mesh area
         */
        set captureOnPointerEnter(captureOnPointerEnter: boolean);
        /**
         * Disposes of the mesh and the HTML element
         */
        dispose(): void;
        /**
         * @internal
         */
        _markAsUpdated(): void;
        /**
         * Sets the content of the element to the specified content adjusting the mesh scale to match and making it visible.
         * If the the specified content is undefined, then it will make the mesh invisible.  In either case it will clear the
         * element content first.
         * @param element The element to render as a mesh
         * @param width The width of the mesh in Babylon units
         * @param height The height of the mesh in Babylon units
         */
        setContent(element: HTMLElement, width: number, height: number): void;
        setEnabled(enabled: boolean): void;
        /**
         * Sets the content size in pixels
         * @param width width of the source
         * @param height height of the source
         */
        setContentSizePx(width: number, height: number): void;
        protected _setAsReady(ready: boolean): void;
        protected _doSetEnabled(enabled: boolean): void;
        protected _updateScaleIfNecessary(): void;
        protected _createMask(): void;
        protected _setElementzIndex(zIndex: number): void;
        /**
         * Callback used by the PointerEventsCaptureBehavior to capture pointer events
         */
        capturePointerEvents(): void;
        /**
         * Callback used by the PointerEventsCaptureBehavior to release pointer events
         */
        releasePointerEvents(): void;
        protected _createElement(): HTMLDivElement | undefined;
    }


    export type FitStrategyType = {
        wrapElement(element: HTMLElement): HTMLElement;
        updateSize(sizingElement: HTMLElement, width: number, height: number): void;
    };
    export var FitStrategy: {
        CONTAIN: FitStrategyType;
        COVER: FitStrategyType;
        STRETCH: FitStrategyType;
        NONE: FitStrategyType;
    };



}


                