/* eslint-disable @typescript-eslint/no-unused-vars */

// loader for cartesian projection
mappable.import.loaders.unshift(async (pkg) => {
    if (!pkg.includes('@mappable-world/mappable-cartesian-projection')) {
        return;
    }

    await mappable.import.script(`https://unpkg.com/${pkg}/dist/index.js`);

    return window['@mappable-world/mappable-cartesian-projection'];
});

const BOUNDS = [
    [54.58311, 25.9985],
    [56.30248, 24.47889]
];

const LOCATION = {bounds: BOUNDS};

function getEntitiesProps(CartesianProjection, params) {
    const projection = new CartesianProjection(params.projection.bounds);

    return {
        map: {
            ...params.map,
            location: {center: [0, 0], zoom: params.map.zoomRange.max - 1},
            projection: projection
        },
        tileDataSource: {
            id: 'image',
            copyrights: ['© NASA', '© ESA', '© CSA', '© STScI'],
            raster: {
                type: 'tile',
                fetchTile: `tiles/${params.tiles.pathTemplate}`
            }
        },
        layer: {source: 'image', type: 'tile'}
    };
}
