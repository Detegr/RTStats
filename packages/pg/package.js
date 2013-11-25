Package.describe({
	summary: "PostgreSQL"
});
Npm.depends({
	"pg": "2.8.3"
});
Package.on_use(function (api) {
	api.export('pg'); // `api.export` introduced in Meteor 0.6.5
	api.add_files("pg.js", "server");
});
