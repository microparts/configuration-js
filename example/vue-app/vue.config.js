const { Configuration, StdoutConsoleLogger } = require('@microparts/configuration-js');

module.exports = {
  lintOnSave: false,
  chainWebpack: config => {
    config.plugin('html').tap(options => {
      const conf = new Configuration();
      conf.logger = new StdoutConsoleLogger();
      conf.load();

      options[0].__config = JSON.stringify(conf.all());
      options[0].__stage = conf.stage;

      return options;
    });
  }
};
