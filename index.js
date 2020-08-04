const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const mysqldump = require('mysqldump');

// s3 configration
const bucket = 's3-bucket-name';
const s3 = new AWS.S3({
	accessKeyId: 'Paste your access key',
	secretAccessKey: 'Paste your secret key'
});
// Concatenate root directory path with our backup folder.
const backupDirPath = path.join(__dirname, 'database-backup');
// databases to backup
const dbOptions = [
	{   // localhost dummy db for testing
		user: 'db-username',
		pass: 'db-password',
		host: 'hostname',
		database: 'database-name',
		autoBackup: false,
		removeOldBackup: false,
		keepLastDaysBackup: 2,
		bPath: 'BAPIDB'//bucket dir
	},
];

// return stringDate as a date object.
exports.stringToDate = dateString => {
	return new Date(dateString);
};

// Check if variable is empty or not.


// Auto backup function
exports.dbAutoBackUp = async () => {
	for (let index = 0; index < dbOptions.length; index++) {
		let date = new Date();
		currentDate = this.stringToDate(date);
		const element = dbOptions[index];
		console.log(element);
		
		if (element.autoBackup) {
			con = {
				host: element.host,
				user: element.user,
				password: element.pass,
				database: element.database,
			}
			fName = element.database + '-' + currentDate.getHours() + '_' + currentDate.getMinutes() + '-' + currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate() + '_dump.sql';
			name = backupDirPath + '/' + fName;
			console.log('starting bakup');
			await mysqldump({
				connection: con,
				dumpToFile: name,
				// compressFile: true,
			});
			console.log('end backup');
			console.log('upload start');
			await this.uploadFile(fName, element.bPath);
		}
	}
	return;
};

exports.uploadFile = async (fileName, key) => {
	// Read content from the file
	console.log('reading file');
	const fileContent = fs.readFileSync(backupDirPath + '/' + fileName);
	console.log('file readed');
	// Setting up S3 upload parameters
	const params = {
		Bucket: bucket,
		Key: key + '/' + fileName, // File name you want to save as in S3
		Body: fileContent
	};
	// Uploading files to the bucket
	console.log('uploading...');
	await s3.upload(params, function (err, data) {
		if (err) {
			throw err;
		}
		console.log(`File uploaded successfully. ${data.Location}`);
	}).promise();
	console.log('uploaded!');
};
exports.removeOldFile = () => {
	fs.readdir(backupDirPath, function (err, files) {
		files.forEach(function (file, index) {
			fs.stat(path.join(backupDirPath, file), function (err, stat) {
				var endTime, now;
				if (err) {
					return console.error(err);
				}
				now = new Date().getTime();
				// 3600000 => 7 days
				endTime = new Date(stat.ctime).getTime() + 3600000;
				if (now > endTime) {
					fs.unlink(backupDirPath + '/' + file, function (err) {
						if (err) return console.log(err);
						console.log(`File deleted successfully. ${file}`);
					});
				}
			});
		});
	});
}
