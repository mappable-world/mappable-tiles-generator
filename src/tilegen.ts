import fs from 'node:fs';
import path from 'node:path';
import type {GenericBounds, MMapProps, MapMode, WorldOptions, ZoomRange} from '@mappable-world/mappable-types';
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

export const defaultOptions: Required<GenerationOptions> = {
    tileSize: 256,
    zoomRange: {},
    shouldCenter: false,
    withEmptyTiles: false,
    backgroundColor: '#00000000',
    pathTemplate: '{{z}}/{{y}}-{{x}}.png'
};

interface Configuration {
    left: number;
    top: number;
    width: number;
    height: number;
    tilePath: string;
    scale: number;
}

export async function generateTiles(source: string, destination: string, options: GenerationOptions): Promise<void> {
    const computedOptions = {...defaultOptions, ...options};
    const {tileSize, shouldCenter, withEmptyTiles, pathTemplate, backgroundColor} = computedOptions;
    let image = await Jimp.read(source);

    const maxImageZoom = Math.ceil(Math.log2(Math.max(image.getWidth(), image.getHeight()) / tileSize));
    const zoomRange = {
        min: computedOptions.zoomRange.min ?? 0,
        max: computedOptions.zoomRange.max ?? maxImageZoom
    };

    const maxZoomImage = await getMaxZoomImage(image, {
        zoomRange,
        tileSize,
        maxImageZoom,
        shouldCenter,
        backgroundColor
    });
    const imageSize: ImageSize = {width: image.getWidth(), height: image.getHeight()};
    const configurations: Configuration[] = [];

    for (let zoom = zoomRange.min; zoom <= zoomRange.max; zoom++) {
        const [minX, minY, maxX, maxY] = getTilesRange({
            zoom,
            maxImageZoom,
            tileSize,
            withEmptyTiles,
            shouldCenter,
            imageSize
        });
        const zoomWorldSize = Math.pow(2, maxImageZoom - zoom);
        const zoomTileSize = tileSize * zoomWorldSize;

        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                const left = x * zoomTileSize;
                const top = y * zoomTileSize;
                const width = Math.min(zoomTileSize, maxZoomImage.getWidth() - left);
                const height = Math.min(zoomTileSize, maxZoomImage.getHeight() - top);
                const scale = 1 / zoomWorldSize;
                const tilePath = pathTemplate
                    .replace('{{x}}', String(x))
                    .replace('{{y}}', String(y))
                    .replace('{{z}}', String(zoom));

                configurations.push({left, top, width, height, scale, tilePath});
            }
        }
    }

    const tileBackground = await Jimp.create(tileSize, tileSize, backgroundColor);

    await Promise.all(
        configurations.map(async ({left, top, width, height, scale, tilePath}) => {
            const cropped = await crop(maxZoomImage, left, top, width, height);
            const tile = cropped.resize(cropped.getWidth() * scale, Jimp.AUTO);

            await tileBackground.clone().blit(tile, 0, 0).writeAsync(path.join(destination, tilePath));
        })
    );

    const params = getParams({imageSize, shouldCenter, maxImageZoom, zoomRange, tileSize, pathTemplate});
    await fs.promises.writeFile(path.join(destination, 'params.json'), JSON.stringify(params, null, 4));
}

async function crop(img: Jimp, x: number, y: number, width: number, height: number): Promise<Jimp> {
    let bitmap: Buffer;

    if (x === 0 && width === img.bitmap.width) {
        const start = (width * y + x) << 2;
        const end = start + ((height * width) << 2);

        bitmap = img.bitmap.data.subarray(start, end);
    } else {
        bitmap = Buffer.allocUnsafe(width * height * 4);
        let offset = 0;

        img.scanQuiet(x, y, width, height, function (x, y, idx) {
            const data = img.bitmap.data.readUInt32BE(idx);
            bitmap.writeUInt32BE(data, offset);
            offset += 4;
        });
    }

    const res = await Jimp.create(width, height);
    res.bitmap.data = bitmap;

    return res;
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
    const worldTileSize = Math.pow(2, maxImageZoom) * tileSize;
    const halfWorldTileSize = worldTileSize / 2;

    return {
        image: imageSize,
        projection: {
            bounds: shouldCenter
                ? [
                      [-halfWorldTileSize, -halfWorldTileSize],
                      [halfWorldTileSize, halfWorldTileSize]
                  ]
                : [
                      [-imageHalfSize.width, imageHalfSize.height - worldTileSize],
                      [worldTileSize - imageHalfSize.width, imageHalfSize.height]
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
