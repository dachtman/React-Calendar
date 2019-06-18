const express = require("express");
const path = require("path");
const calendar = require("./scripts/calendar.js");
const app = express();
app.set("port", process.env.PORT || 3001);

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static("client/build"));
}

app.listen(app.get("port"), () => {
	console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
app.get('/',(req,res)=>{
	res.sendFile(path.join("client","build","index.html"));
});
app.get('/calendars',(req,res) => {
	if(req.query.index){
		calendar.get(req.query.index).then((data) => {
			res.json(data);
		},(err) => {
			res.status(400).send(err);
		});
	}else{
		calendar.getAll().then((data) => {
			res.json(Array.prototype.concat.apply([],data.filter((d)=>{return d})).sort(calendar.sortEvents));
		});
	}
});
app.get('/setup',(req,res) => {
	res.json({
		start_of_month : calendar.getStartDate(),
		end_of_month : calendar.getEndDate(),
		today : calendar.getTodaysDate()
	});
});