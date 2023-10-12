import fs from 'node:fs';
import path from 'node:path';
import Jimp from 'jimp';

export type GenerationOptions = {
    tileSize?: number;
    zoomRange?: {min?: number, max?: number};
    shouldCenter?: boolean;
    withEmptyTiles?: boolean;
    pathTemplate?: string;
}

const defaultOptions: Required<GenerationOptions> = {
    tileSize: 256,
    zoomRange: {},
    shouldCenter: false,
    withEmptyTiles: false,
    pathTemplate: '{{z}}/{{y}}-{{x}}.png'
}

export async function generateTiles(source: string, destination: string, options: GenerationOptions) {
    const {tileSize, zoomRange, shouldCenter, withEmptyTiles, pathTemplate} = {...defaultOptions, ...options};
    let image = await Jimp.read(source);

    await fs.promises.rm(destination, {recursive: true, force: true, maxRetries: 1});
    await fs.promises.mkdir(destination);

    const maxImageZoom = Math.ceil(Math.log2(Math.max(image.getWidth(), image.getHeight()) / tileSize));
    const maxZoom = zoomRange.max ?? maxImageZoom;
    const minZoom = zoomRange.min ?? 0;

    let maxZoomImage = image.clone();

    if (maxImageZoom !== maxZoom) {
        const resizeWidth = maxZoomImage.getWidth() / Math.pow(2, maxImageZoom - maxZoom);
        maxZoomImage = maxZoomImage.resize(resizeWidth, Jimp.AUTO);
    }

    if (shouldCenter) {
        const backgroundSize = tileSize * Math.pow(2, maxZoom);
        const backgroundLeft = (backgroundSize - maxZoomImage.getWidth()) / 2;
        const backgroundTop = (backgroundSize - maxZoomImage.getHeight()) / 2;

        const imageBackground = await Jimp.create(backgroundSize, backgroundSize, 0x00000000);
        maxZoomImage = imageBackground.blit(maxZoomImage, backgroundLeft, backgroundTop);
    }

    const worldSize = Math.pow(2, maxImageZoom) * tileSize;
    const halfWorldSize = worldSize / 2;
    const imageSize = {width: image.getWidth(), height: image.getHeight()};
    const imageHalfSize = {width: imageSize.width / 2, height: imageSize.height / 2};
    const params = {
        image: imageSize,
        projection: {
            bounds: shouldCenter ?
                [
                    [-halfWorldSize, -halfWorldSize],
                    [halfWorldSize, halfWorldSize]
                ] :
                [
                    [-imageHalfSize.width, imageHalfSize.height - worldSize],
                    [worldSize - imageHalfSize.width, imageHalfSize.height]
                ],
            cycled: [false, false]
        },
        map: {
            zoomRange: {min: minZoom, max: maxZoom},
            mode: 'raster',
            restrictMapArea: [
                [-imageHalfSize.width, -imageHalfSize.height],
                [imageHalfSize.width, imageHalfSize.height],
            ],
            // Do not copy the world along the axes
            worldOptions: { cycledX: false, cycledY: false },
        },
        tiles: {pathTemplate}
    }

    const filePromises: Promise<unknown>[] = [
        fs.promises.writeFile(path.join(destination, 'params.json'), JSON.stringify(params, null, 4))
    ];
    const tileBackground = await Jimp.create(tileSize, tileSize, 0x00000000);

    for (let zoom = maxZoom; zoom >= minZoom; zoom--) {
        const zoomImage = zoom === maxZoom ?
            maxZoomImage :
            maxZoomImage.resize(maxZoomImage.getWidth() / 2, Jimp.AUTO);
        const maxTilesNumber = Math.pow(2, zoom);
        let minX = 0;
        let minY = 0;
        let maxX = maxTilesNumber;
        let maxY = maxTilesNumber;

        if (!withEmptyTiles) {
            const imageScaleFactor = Math.pow(2, maxImageZoom - zoom);
            const width = image.getWidth() / imageScaleFactor;
            const height = image.getHeight() / imageScaleFactor;
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

    return Promise.all(filePromises);
}
