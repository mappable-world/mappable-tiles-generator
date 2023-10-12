import * as yargs from 'yargs';
import * as path from 'path';

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
        default: path.join(process.cwd(), 'tiles'),
        description: 'Destination tiles folder path'
    })
    .option('pathTemplate', {
        type: 'string',
        alias: 'path',
        demandOption: false,
        default: '{{z}}/{{y}}-{{x}}.png',
        description: 'Destination tiles folder path'
    })
    .option('minZoom', {
        type: 'number',
        alias: 'min',
        demandOption: false,
        default: undefined
    })
    .option('maxZoom', {
        type: 'number',
        alias: 'max',
        demandOption: false,
        default: undefined
    })
    .option('tileSize', {
        type: 'number',
        alias: 'size',
        demandOption: false,
        default: 256
    })
    .option('shouldCenter', {
        type: 'boolean',
        alias: ['center', 'c'],
        demandOption: false,
        default: false
    })
    .option('withEmptyTiles', {
        type: 'boolean',
        alias: ['emptyTiles', 'e'],
        demandOption: false,
        default: false
    })
    .option('backgroundColor', {
        type: 'string',
        alias: ['background', 'b'],
        demandOption: false,
        default: '#00000000'
    })
    .version(require('../package').version)
    .alias('version', 'v')
    .help('help')
    .alias('help', 'h')
    .epilogue('License: Apache-2')
    .parseSync();
