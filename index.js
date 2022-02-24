#!/usr/bin/env node
const express = require("express");
const { Command } = require("commander");
const inquirer = require("inquirer");
const { createProxyMiddleware } = require("http-proxy-middleware");

const program = new Command();
var port = 9090;
var opts;
const optionsDefault = {
  target: "",
  pathRewrite:{}
};
program
  .command("open <destination>")
  .description("填写目的URL")
  .action((...args) => {
    openProxy(args[0], port);
  });
program.option("-p, --port <port>", "设置代理服务器的端口号");
program
  .command("init")
  .description("初始化服务器")
  .action(() => {
    setUrlAndPort();
  });
program.parse(process.argv);
// 获取代理端口号
opts = program.opts();
// 设置端口号
if (opts.port) port = opts.port;
// 设置端口号和url
async function setUrlAndPort() {
  const promt = [
    {
      type: "input",
      name: "url",
      message: "填入目标url地址",
    },
    {
      type: "input",
      name: "port",
      message: "填入服务器端口号",
    },
  ];
  var answers = await inquirer.prompt(promt);
  if (answers.url) optionsDefault.target = answers.url;
  if (+answers.port) optionsDefault.port = answers.port;
  else optionsDefault.port = 8888;
  await getInput();
  openProxy(optionsDefault.target, optionsDefault.port);
}
// 连续设置路由规则
async function getInput() {
  while (true) {
    var answers = await setMapRouter();
    var origin = '^/'+answers.origin
    optionsDefault.pathRewrite[origin] = answers.destination
    var next = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: "是否继续设置?",
      },
    ]);
    if (!next.continue) {
      break;
    }
  }
  return 1
}
// 设置路由规则
async function setMapRouter() {
  var answers = await inquirer.prompt([
    {
      type: "input",
      name: "origin",
      message: "需要替换的路由字段",
    },
    {
      type: "input",
      name: "destination",
      message: "替换路由字段",
    },
  ]);
  return answers;
}

// 开启代理服务器
function openProxy(url, port) {
  const options = {
    target: url,
    changeOrigin: true,
    pathRewrite: {
      "^/api": "",
      ...optionsDefault.pathRewrite
    },
  };
  const exampleProxy = createProxyMiddleware(options);
  const app = express();
  app.use("/", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  app.use("/api", exampleProxy);
  app.listen(port, () => {
    console.log("代理服务已经开启...");
    console.log('目标服务器地址: ',url);
    console.log("端口号: ", port);
  });
}
