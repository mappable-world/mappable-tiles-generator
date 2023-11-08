import {isMainThread, parentPort, workerData} from 'node:worker_threads';
import path from 'node:path';
import Jimp from 'jimp';

export interface Configuration {
    left: number;
    top: number;
    width: number;
    height: number;
    tilePath: string;
    scale: number;
}

export interface WorkerData {
    tileSize: number;
    backgroundColor: string;
    destination: string;
    image: {
        data: Uint8Array;
        width: number;
        height: number;
    }
}

let generate: (configuration: Configuration) => Promise<void>;

async function init({tileSize, backgroundColor, destination, image}:  WorkerData) {
    if (generate) return;

    const maxZoomImage = await Jimp.create(image.width, image.height);
    maxZoomImage.bitmap.data = Buffer.from(image.data);
    const tileBackground = await Jimp.create(tileSize, tileSize, backgroundColor);

    generate = async ({left, top, width, height, scale, tilePath}: Configuration) => {
        const cropped = await crop(maxZoomImage, left, top, width, height);
        const tile = cropped.resize(cropped.getWidth() * scale, Jimp.AUTO);

        await tileBackground.clone().blit(tile, 0, 0).writeAsync(path.join(destination, tilePath));
    }
}

export async function crop(img: Jimp, x: number, y: number, width: number, height: number): Promise<Jimp> {
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


if (!isMainThread) {
    const ready = init(workerData);

    parentPort.on('message', async (configuration: Configuration) => {
        await ready;

        parentPort.postMessage(await generate(configuration));
    });
}
