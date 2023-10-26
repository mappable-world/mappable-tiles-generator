module.exports = (args, env, dir = process.cwd()) => {
    const {devServer} = require('@mappable-world/mappable-cli/webpack.config')(args, env, dir);
    return {mode: 'development', entry: {}, devServer};
};
