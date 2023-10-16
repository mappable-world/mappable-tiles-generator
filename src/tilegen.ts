import type {GenericBounds, MMapProps, MapMode, WorldOptions, ZoomRange} from '@mappable-world/mappable-types';
import fs from 'node:fs';
import path from 'node:path';
import Jimp from 'jimp';

export interface GenerationOptions {
    tileSize?: number;
    zoomRange?: Partial<ZoomRange>;
    shouldCenter?: boolean;
    withEmptyTiles?: boolean;
    backgroundColor?: string;
    pathTemplate?: string;
}

export interface ImageSize {
    width: number;
    height: number;
}

const defaultOptions: Required<GenerationOptions> = {
    tileSize: 256,
    zoomRange: {},
    shouldCenter: false,
    withEmptyTiles: false,
    backgroundColor: '#00000000',
    pathTemplate: '{{z}}/{{y}}-{{x}}.png'
};

export async function generateTiles(source: string, destination: string, options: GenerationOptions): Promise<void> {
    const computedOptions = {...defaultOptions, ...options};
    const {tileSize, shouldCenter, withEmptyTiles, pathTemplate, backgroundColor} = computedOptions;
    let image = await Jimp.read(source);

    const maxImageZoom = Math.ceil(Math.log2(Math.max(image.getWidth(), image.getHeight()) / tileSize));
    const zoomRange = {
        min: computedOptions.zoomRange.min ?? 0,
        max: computedOptions.zoomRange.max ?? maxImageZoom
    };

    const maxZoomImage = await getMaxZoomImage(image, {zoomRange, tileSize, maxImageZoom, shouldCenter, backgroundColor});

    const imageSize: ImageSize = {width: image.getWidth(), height: image.getHeight()};

    const filePromises: Promise<unknown>[] = [];
    const tileBackground = await Jimp.create(tileSize, tileSize, backgroundColor);

    for (let zoom = zoomRange.max; zoom >= zoomRange.min; zoom--) {
        const zoomImage =
            zoom === zoomRange.max ? maxZoomImage : maxZoomImage.resize(maxZoomImage.getWidth() / 2, Jimp.AUTO);
        const [minX, minY, maxX, maxY] = getTilesRange({
            zoom,
            maxImageZoom,
            tileSize,
            withEmptyTiles,
            shouldCenter,
            imageSize
        });

        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                const left = x * tileSize;
                const top = y * tileSize;
                const width = Math.min(tileSize, zoomImage.getWidth() - left);
                const height = Math.min(tileSize, zoomImage.getHeight() - top);
                const tilePath = pathTemplate
                    .replace('{{x}}', String(x))
                    .replace('{{y}}', String(y))
                    .replace('{{z}}', String(zoom));

                filePromises.push(
                    tileBackground
                        .clone()
                        .blit(zoomImage, 0, 0, left, top, width, height)
                        .writeAsync(path.join(destination, tilePath))
                );
            }
        }
    }

    const params = getParams({imageSize, shouldCenter, maxImageZoom, zoomRange, tileSize, pathTemplate});
    filePromises.push(fs.promises.writeFile(path.join(destination, 'params.json'), JSON.stringify(params, null, 4)));

    await Promise.all(filePromises);
}

export interface GetTilesRangeOptions {
    zoom: number;
    tileSize: number;
    maxImageZoom: number;
    withEmptyTiles: boolean;
    shouldCenter: boolean;
    imageSize: ImageSize;
}
export type TilesRange = [minX: number, minY: number, maxX: number, maxY: number];
export function getTilesRange(options: GetTilesRangeOptions): TilesRange {
    const {zoom, tileSize, maxImageZoom, withEmptyTiles, shouldCenter, imageSize} = options;

    const maxTilesNumber = Math.pow(2, zoom);
    let minX = 0;
    let minY = 0;
    let maxX = maxTilesNumber;
    let maxY = maxTilesNumber;

    if (!withEmptyTiles) {
        const imageScaleFactor = Math.pow(2, maxImageZoom - zoom);
        const width = imageSize.width / imageScaleFactor;
        const height = imageSize.height / imageScaleFactor;
        const sizeX = Math.ceil(width / tileSize);
        const sizeY = Math.ceil(height / tileSize);

        if (shouldCenter) {
            const offsetX = Math.floor((maxTilesNumber - sizeX) / 2);
            const offsetY = Math.floor((maxTilesNumber - sizeY) / 2);
            minX = offsetX;
            minY = offsetY;
            maxX = maxTilesNumber - offsetX;
            maxY = maxTilesNumber - offsetY;
        } else {
            maxX = sizeX;
            maxY = sizeY;
        }
    }

    return [minX, minY, maxX, maxY];
}

export interface GetParamsOptions {
    zoomRange: ZoomRange;
    tileSize: number;
    maxImageZoom: number;
    shouldCenter: boolean;
    pathTemplate: string;
    imageSize: ImageSize;
}
export interface Params {
    image: ImageSize;
    projection: {
        bounds: GenericBounds<[number, number]>;
        cycled: [boolean, boolean];
    };
    map: {
        zoomRange: ZoomRange;
        mode: MapMode;
        restrictMapArea: MMapProps['restrictMapArea'];
        worldOptions: WorldOptions;
    };
    tiles: {
        pathTemplate: string;
    };
}
export function getParams(options: GetParamsOptions): Params {
    const {tileSize, imageSize, maxImageZoom, shouldCenter, pathTemplate, zoomRange} = options;

    const imageHalfSize = {width: imageSize.width / 2, height: imageSize.height / 2};
    const worldSize = Math.pow(2, maxImageZoom) * tileSize;
    const halfWorldSize = worldSize / 2;

    return {
        image: imageSize,
        projection: {
            bounds: shouldCenter
                ? [
                      [-halfWorldSize, -halfWorldSize],
                      [halfWorldSize, halfWorldSize]
                  ]
                : [
                      [-imageHalfSize.width, imageHalfSize.height - worldSize],
                      [worldSize - imageHalfSize.width, imageHalfSize.height]
                  ],
            cycled: [false, false]
        },
        map: {
            zoomRange,
            mode: 'raster',
            restrictMapArea: [
                [-imageHalfSize.width, -imageHalfSize.height],
                [imageHalfSize.width, imageHalfSize.height]
            ],
            // Do not copy the world along the axes
            worldOptions: {cycledX: false}
        },
        tiles: {pathTemplate}
    };
}

export interface GetMaxZoomImageOptions {
    zoomRange: ZoomRange;
    tileSize: number;
    maxImageZoom: number;
    shouldCenter: boolean;
    backgroundColor: string;
}
export async function getMaxZoomImage(image: Jimp, options: GetMaxZoomImageOptions): Promise<Jimp> {
    const {zoomRange, tileSize, maxImageZoom, shouldCenter, backgroundColor} = options;
    let result = image.clone();

    if (maxImageZoom !== zoomRange.max) {
        const resizeWidth = result.getWidth() / Math.pow(2, maxImageZoom - zoomRange.max);
        result = result.resize(resizeWidth, Jimp.AUTO);
    }

    if (shouldCenter) {
        const backgroundSize = tileSize * Math.pow(2, zoomRange.max);
        const backgroundLeft = (backgroundSize - result.getWidth()) / 2;
        const backgroundTop = (backgroundSize - result.getHeight()) / 2;

        const imageBackground = await Jimp.create(backgroundSize, backgroundSize, backgroundColor);
        result = imageBackground.blit(result, backgroundLeft, backgroundTop);
    }

    return result;
}
