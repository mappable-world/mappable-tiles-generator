import * as yargs from 'yargs';

export const argv = yargs
    .strict()
    .option('source', {
        type: 'string',
        alias: ['src', 's'],
        demandOption: true,
        description: 'Source image path'
    })
    .option('destination', {
        type: 'string',
        alias: ['dst', 'd'],
        demandOption: false,
        default: './tiles',
        description: 'Destination tiles folder path'
    })
    .option('pathTemplate', {
        type: 'string',
        alias: 'path',
        demandOption: false,
        default: '{{z}}/{{y}}-{{x}}.png',
        description: 'Template pathname for the generated tile files'
    })
    .option('minZoom', {
        type: 'number',
        alias: 'min',
        demandOption: false,
        default: undefined,
        description: 'Minimum zoom level for tile generation'
    })
    .option('maxZoom', {
        type: 'number',
        alias: 'max',
        demandOption: false,
        default: undefined,
        description: 'Maximum zoom level for tile generation'
    })
    .option('tileSize', {
        type: 'number',
        alias: 'size',
        demandOption: false,
        default: 256,
        description: 'Width and height tile size'
    })
    .option('shouldCenter', {
        type: 'boolean',
        alias: ['center', 'c'],
        demandOption: false,
        default: false,
        description: 'Should center image be in tail grid'
    })
    .option('withEmptyTiles', {
        type: 'boolean',
        alias: ['emptyTiles', 'e'],
        demandOption: false,
        default: false,
        description: 'Should generate background empty tiles around the image'
    })
    .option('backgroundColor', {
        type: 'string',
        alias: ['background', 'b'],
        demandOption: false,
        default: '#00000000',
        description: 'Background color for completely or partially empty tiles'
    })
    .version(require('../package').version)
    .alias('version', 'v')
    .help('help')
    .alias('help', 'h')
    .epilogue('License: Apache-2')
    .parseSync();
