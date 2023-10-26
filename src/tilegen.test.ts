import Jimp from 'jimp';
import {getMaxZoomImage, getParams, getTilesRange} from './tilegen';

describe('Tilegen utility', () => {
    const tileSize = 256;
    const zoomRange = {min: 0, max: 1};
    const imageSize = {width: 200, height: 400};
    const maxImageZoom = Math.ceil(Math.log2(Math.max(imageSize.width, imageSize.height) / tileSize));
    const worldSize = tileSize * Math.pow(2, zoomRange.max);

    describe('check getParams', () => {
        const pathTemplate = 'pathTemplate';
        const props = {
            zoomRange,
            tileSize,
            maxImageZoom,
            pathTemplate,
            imageSize
        };
        const expected = {
            image: imageSize,
            map: {
                mode: 'raster',
                zoomRange,
                restrictMapArea: [
                    [-100, -200],
                    [100, 200]
                ],
                worldOptions: {
                    cycledX: false
                }
            },
            projection: {
                bounds: [
                    [-256, -256],
                    [256, 256]
                ],
                cycled: [false, false]
            },
            tiles: {pathTemplate}
        };

        it('should work correctly with "shouldCenter: true"', () => {
            expect(getParams({...props, shouldCenter: true})).toStrictEqual(expected);
        });

        it('should work correctly with "shouldCenter: false"', () => {
            expect(getParams({...props, shouldCenter: false})).toStrictEqual({
                ...expected,
                projection: {
                    ...expected.projection,
                    bounds: [
                        [-100, -312],
                        [412, 200]
                    ]
                }
            });
        });
    });

    describe('check getTilesRange', () => {
        const props = {
            zoom: 4,
            tileSize,
            maxImageZoom,
            imageSize
        };

        it('should work correctly with "shouldCenter: true", "withEmptyTiles: true"', () => {
            expect(getTilesRange({...props, shouldCenter: true, withEmptyTiles: true})).toStrictEqual([0, 0, 16, 16]);
        });

        it('should work correctly with "shouldCenter: false", "withEmptyTiles: true"', () => {
            expect(getTilesRange({...props, shouldCenter: false, withEmptyTiles: true})).toStrictEqual([0, 0, 16, 16]);
        });

        it('should work correctly with "shouldCenter: true", "withEmptyTiles: false"', () => {
            expect(getTilesRange({...props, shouldCenter: true, withEmptyTiles: false})).toStrictEqual([4, 1, 12, 15]);
        });

        it('should work correctly with "shouldCenter: false", "withEmptyTiles: false"', () => {
            expect(getTilesRange({...props, shouldCenter: false, withEmptyTiles: false})).toStrictEqual([0, 0, 7, 13]);
        });
    });

    describe('check getMaxZoomImage', () => {
        const image = Jimp.create(imageSize.width, imageSize.height, '#444444');
        const backgroundColor = '#00000000';
        const backgroundImage = Jimp.create(worldSize, worldSize, backgroundColor);
        const props = {
            zoomRange,
            tileSize,
            maxImageZoom,
            backgroundColor
        };

        it('should work correctly with "shouldCenter: true"', async () => {
            const maxZoomImage = await getMaxZoomImage(await image, {...props, shouldCenter: true});
            let result = await backgroundImage;
            result = result.clone().blit(await image, (worldSize - imageSize.width) / 2, (worldSize - imageSize.height) / 2);

            expect(await maxZoomImage.getBase64Async(Jimp.AUTO)).toBe(await result.getBase64Async(Jimp.AUTO));
        });

        it('should work correctly with "shouldCenter: false"', async () => {
            const maxZoomImage = await getMaxZoomImage(await image, {...props, shouldCenter: false});
            const result = await image;

            expect(await maxZoomImage.getBase64Async(Jimp.AUTO)).toBe(await result.getBase64Async(Jimp.AUTO));
        });
    });
});
