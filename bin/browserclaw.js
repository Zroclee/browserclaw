#!/usr/bin/env node

const { Command } = require('commander');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const program = new Command();
const PID_FILE = path.join(process.cwd(), '.gateway.pid');

program
  .name('browserclaw')
  .description('个人专属浏览器AI助手 CLI')
  .version('1.0.0');

program
  .command('start')
  .description('打包项目并启动网关服务')
  .action(() => {
    console.log('开始打包项目...');
    try {
      execSync('pnpm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('打包失败，终止启动。');
      process.exit(1);
    }

    console.log('启动网关服务...');
    
    // 使用 spawn 并发启动进程，这样命令执行完毕后，后台服务可以继续运行
    // 环境变量中加入 NODE_ENV=production，对应 package.json 中的 gateway:prod 脚本内容
    const gatewayProcess = spawn('node', ['apps/gateway/dist/server.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      detached: true,
      stdio: 'ignore'
    });

    // 让父进程退出时不等待子进程
    gatewayProcess.unref();

    if (gatewayProcess.pid) {
      fs.writeFileSync(PID_FILE, gatewayProcess.pid.toString());
      console.log(`网关服务已在后台启动，PID: ${gatewayProcess.pid}`);
    } else {
      console.error('启动网关服务失败，未获取到 PID。');
    }
  });

program
  .command('close')
  .description('关闭运行中的网关服务')
  .action(() => {
    if (!fs.existsSync(PID_FILE)) {
      console.log('未找到运行中的网关服务 (PID 文件不存在)。');
      return;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
    try {
      // 尝试终止进程
      process.kill(pid, 'SIGTERM');
      console.log(`已成功关闭网关服务 (PID: ${pid})`);
    } catch (error) {
      if (error.code === 'ESRCH') {
        console.log(`网关服务 (PID: ${pid}) 已经停止。`);
      } else {
        console.error(`无法关闭进程 ${pid}:`, error.message);
      }
    } finally {
      // 无论如何，都清理 PID 文件
      fs.unlinkSync(PID_FILE);
    }
  });

program.parse(process.argv);
