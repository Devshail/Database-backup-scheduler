process.env.UV_THREADPOOL_SIZE =1;
const CronJob = require('cron').CronJob;
const Cron = require('./index.js');

// AutoBackUp every week (at 00:00 on Sunday)
// 48 15 * * *                   for on a day at time
// mint hr date month year       for on a day at time


new CronJob('19 18 * * *',async ()=> {
      await Cron.dbAutoBackUp();
      await Cron.removeOldFile();
    },
  null,
  true,
);