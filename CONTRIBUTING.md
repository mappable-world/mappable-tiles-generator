# Contributing

> To get started in the `.env` file, you need to declare `APIKEY` https://mappable.world/docs/js-api/quickstart.html#get-api-key:

To get started:

```sh
nvm use
npm run watch
```

or so if you didn't create the `.env` file

```sh
APIKEY=%APIKEY% npm start
```

To check with linter:

```sh
npm run lint
```

For the final build:

```sh
npm run build
```

## Examples

> **_NOTE:_**
>
> For examples we use Carina Nebula image with copyrights from [webbtelescope.org](https://webbtelescope.org/contents/media/images/2022/031/01G77PKB8NKR7S8Z6HBXMYATGJ)

Please run:

- `npm run build # or watch`. This command will built this utility
- `npm run examples:build`. This will load image and generate tiles
- `npm run examples`. This will serve examples


## GitHub actions

After you create a new tag, or just push changes to the server, ci will be launched

```sh
npm version --no-git-tag-version
git add --all
git commit -m "New version"
git tag 0.0.2
git push --tags origin HEAD:main
```

or run

```sh
npm run bump
```

CI described here

- `.github/workflows/release.yml` - triggered when a new tag is created
- `.github/workflows/tests.yml` - triggers on any push to the main branch

For it to work, you need to declare two secrets in the GitHub Action:

- `APIKEY` - To run autotests on the JS API https://mappable.world/docs/js-api/quickstart.html#get-api-key
- `NPM_TOKEN` - To publish your package to npm
