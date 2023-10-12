import * as tilegen from './tilegen';
import {argv} from './argv';

if (require.main === module) {
    const options: tilegen.GenerationOptions = {
        zoomRange: {},
        shouldCenter: argv.shouldCenter,
        withEmptyTiles: argv.withEmptyTiles,
        pathTemplate: argv.pathTemplate
    };

    if (argv.minZoom) {
        options.zoomRange.min = argv.minZoom;
    }

    if (argv.maxZoom) {
        options.zoomRange.max = argv.maxZoom;
    }

    if (argv.tileSize) {
        options.tileSize = argv.tileSize;
    }

    tilegen.generateTiles(argv.source, argv.destination, options).catch(console.log);
}

export * from './tilegen';
export default tilegen;
