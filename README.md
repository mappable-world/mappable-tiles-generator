# Mappable Tile generator CLI utility

[![npm version](https://badge.fury.io/js/@mappable-world%2Fmappable-tiles-generator.svg)](https://badge.fury.io/js/@mappable-world%2Fmappable-tiles-generator)
[![npm](https://img.shields.io/npm/dm/@mappable-world/mappable-tiles-generator.svg)](https://www.npmjs.com/package/@mappable-world/mappable-tiles-generator)
[![Build Status](https://github.com/mappable-world/mappable-tiles-generator/workflows/Run%20tests/badge.svg)](https://github.com/mappable-world/mappable-tiles-generator/actions/workflows/tests.yml)

This tool will help you in splitting a large image into smaller tiles for use on a [Mappable](https://mappable.world) map with accurate scale.

Your image will be scaled automatically for each level of zoom (scheme is presented below). At maximum zoom level, the image will show pixel-to-pixel detail. If you would like to see the image at a higher level of zoom, you can use the `maxZoom` option to enlarge it. Additionally, you can choose to restrict the minimum zoom level for tile generation by setting the `minZoom` option.

![tiling scheme](https://github.com/mappable-world/mappable-tiles-generator/blob/main/tiling%20scheme.png?raw=true)

By default, we do not center the image and do not generate empty tiles. If you need it, specify the `shouldCenter` and `withEmptyTiles`` options respectively.

The utility also generates a `params.json` file with presets for correct display of your image on a map. You can see an [example](https://github.com/mappable-world/mappable-tiles-generator/blob/main/example/vanilla.html) of using this utility with [@mappable-world/mappable-cartesian-projection](https://github.com/mappable-world/mappable-cartesian-projection) package.

> **_NOTE:_**
>
> For more information on how to run the examples locally, please see the [CONTRIBUTING.md](https://github.com/mappable-world/mappable-tiles-generator/blob/main/CONTRIBUTING.md#examples)

## Install

Install Tile generator CLI to be used in your project with

```bash
npm install --save-dev @mappable-world/mappable-tiles-generator
```

And then you should be able to run the CLI with

```bash
npx mappable-tiles-generator --help
```

## Usage

You can use it via terminal:

```
Options:
  -s, --source, --src                  Source image path     [string] [required]
  -d, --destination, --dst             Destination tiles folder path
                                                   [string] [default: "./tiles"]
      --pathTemplate, --path           Template pathname for the generated tile
                                       files
                                     [string] [default: "{{z}}/{{y}}-{{x}}.png"]
      --minZoom, --min                 Minimum zoom level for tile generation
                                                                        [number]
      --maxZoom, --max                 Maximum zoom level for tile generation
                                                                        [number]
      --tileSize, --size               Width and height tile size
                                                         [number] [default: 256]
  -c, --shouldCenter, --center         Should center image be in tail grid
                                                      [boolean] [default: false]
  -e, --withEmptyTiles, --emptyTiles   Should generate background empty tiles
                                       around the image
                                                      [boolean] [default: false]
  -b, --backgroundColor, --background  Background color for completely or
                                       partially empty tiles
                                                 [string] [default: "#00000000"]
  -v, --version                        Show version number             [boolean]
  -h, --help                           Show help                       [boolean]

License: Apache-2
```

Or you can also use it in code:

```js
import {generateTiles} from '@mappable-world/mappable-tiles-generator';

generateTiles(source, destination, {shouldCenter: true});
```
